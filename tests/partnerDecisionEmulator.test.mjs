import test from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const host = process.env.FIRESTORE_EMULATOR_HOST || "";
const projectId = process.env.GCLOUD_PROJECT || "";
if (!/^(localhost|127\\.0\\.0\\.1):[0-9]+$/.test(host) || !/^demo-[a-z0-9-]+$/.test(projectId)) {
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
    if (a.data()?.status !== "pending" || a.data()?.decisionVersion !== expectedVersion || u.data()?.isPartner) {
      throw new Error("conflict");
    }
    tx.update(application, { status: nextStatus, decisionVersion: expectedVersion + 1 });
    if (nextStatus === "approved") tx.update(user, { isPartner: true });
    tx.create(application.collection("history").doc(), { action: nextStatus });
  });
}

test("one concurrent decision succeeds and one audit event is created", async () => {
  await application.set({ status: "pending", decisionVersion: 0 });
  await user.set({ isPartner: false });
  const results = await Promise.allSettled([decide(0, "approved"), decide(0, "rejected")]);
  assert.equal(results.filter(x => x.status === "fulfilled").length, 1);
  assert.equal(results.filter(x => x.status === "rejected").length, 1);
  const [a, u, history] = await Promise.all([application.get(), user.get(), application.collection("history").get()]);
  assert.equal(a.data().decisionVersion, 1);
  assert.equal(history.size, 1);
  assert.equal(u.data().isPartner, a.data().status === "approved");
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
