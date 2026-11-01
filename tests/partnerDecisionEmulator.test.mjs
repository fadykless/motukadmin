import test from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { evaluatePartnerDecision } from "../src/lib/partnerDecisionPolicy.mjs";

const host = process.env.FIRESTORE_EMULATOR_HOST || "";
const projectId = process.env.GCLOUD_PROJECT || "";
if (!/^(localhost|127\.0\.0\.1):[0-9]+$/.test(host) || !/^demo-[a-z0-9-]+$/.test(projectId)) {
  throw new Error("Only a local Firestore emulator with demo-* project is allowed");
}

const app = initializeApp({ projectId }, "c2-concurrency");
const db = getFirestore(app);
const uid = "c2-test-" + Date.now();
const application = db.collection("partnerApplications").doc(uid);
const user = db.collection("users").doc(uid);

async function decide(expectedVersion, nextStatus) {
  return db.runTransaction(async tx => {
    const [a, u] = await Promise.all([tx.get(application), tx.get(user)]);
    const eligibility = evaluatePartnerDecision(a.data(), u.data(), expectedVersion, uid);
    if (!eligibility.ok) throw new Error(eligibility.error);
    tx.update(application, { status: nextStatus, decisionVersion: expectedVersion + 1 });
    if (nextStatus === "approved") tx.update(user, { isPartner: true });
    tx.create(application.collection("history").doc(), { action: nextStatus });
  });
}

test("one concurrent decision succeeds and one audit event is created", async () => {
  await application.set({ userId: uid, status: "pending", decisionVersion: 0 });
  await user.set({ isPartner: false });
  const results = await Promise.allSettled([decide(0, "approved"), decide(0, "rejected")]);
  assert.equal(results.filter(x => x.status === "fulfilled").length, 1);
  assert.equal(results.filter(x => x.status === "rejected").length, 1);
  const [a, u, history] = await Promise.all([application.get(), user.get(), application.collection("history").get()]);
  assert.equal(a.data().decisionVersion, 1);
  assert.equal(history.size, 1);
  assert.equal(u.data().isPartner, a.data().status === "approved");
});

test("stale decision cannot overwrite approved status or create a second event", async () => {
  await application.set({ userId: uid, status: "pending", decisionVersion: 0 });
  await user.set({ isPartner: false });
  const existing = await application.collection("history").get();
  const cleanup = db.batch();
  existing.docs.forEach(doc => cleanup.delete(doc.ref));
  await cleanup.commit();
  await decide(0, "approved");
  await assert.rejects(() => decide(0, "rejected"));
  const [a, u, history] = await Promise.all([
    application.get(), user.get(), application.collection("history").get(),
  ]);
  assert.equal(a.data().status, "approved");
  assert.equal(a.data().decisionVersion, 1);
  assert.equal(u.data().isPartner, true);
  assert.equal(history.size, 1);
});

test("blocked account cannot be approved and produces no history", async () => {
  await application.set({ userId: uid, status: "pending", decisionVersion: 0 });
  await user.set({ isPartner: false, status: "blocked" });
  const existing = await application.collection("history").get();
  const cleanup = db.batch();
  existing.docs.forEach(doc => cleanup.delete(doc.ref));
  await cleanup.commit();
  await assert.rejects(() => decide(0, "approved"));
  const [a, u, history] = await Promise.all([
    application.get(), user.get(), application.collection("history").get(),
  ]);
  assert.equal(a.data().status, "pending");
  assert.equal(a.data().decisionVersion, 0);
  assert.equal(u.data().isPartner, false);
  assert.equal(history.size, 0);
});

test.after(async () => {
  const history = await application.collection("history").get();
  const batch = db.batch();
  history.docs.forEach(doc => batch.delete(doc.ref));
  batch.delete(application);
  batch.delete(user);
  await batch.commit();
  await deleteApp(app);
});
