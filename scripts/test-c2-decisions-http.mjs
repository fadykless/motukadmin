#!/usr/bin/env node
// C2 write-path integration test. This script MUST run exclusively in local demo emulators.
import assert from "node:assert/strict";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const required = {
  GCLOUD_PROJECT: "demo-motuka-c2",
  GOOGLE_CLOUD_PROJECT: "demo-motuka-c2",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  NEXT_PUBLIC_C2_EMULATOR_MODE: "true",
  ADMIN_BASE_URL: "http://127.0.0.1:3100/",
};
for (const [key, value] of Object.entries(required)) {
  if (process.env[key] !== value) throw Error(`Unsafe C2 write test: ${key}`);
}
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS)
  throw Error("Service account credentials forbidden");
if (!process.env.ADMIN_ID_TOKEN) throw Error("Fictional admin token required");

const app = initializeApp({ projectId: "demo-motuka-c2" });
const auth = getAuth(app);
const db = getFirestore(app);
const base = required.ADMIN_BASE_URL;
async function decide(uid, action, expectedVersion, reason) {
  const response = await fetch(new URL(`api/admin/partner-applications/${uid}/decision`, base), {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.ADMIN_ID_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action, expectedVersion, ...(reason ? { reason } : {}) }),
    redirect: "error", signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json();
  return { status: response.status, payload };
}
async function getDetail(uid) {
  const response = await fetch(new URL(`api/admin/partner-applications/${uid}`, base), {
    headers: { Authorization: `Bearer ${process.env.ADMIN_ID_TOKEN}` },
    redirect: "error", signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200);
  return response.json();
}
const uidApprove = "c2-test-candidate";
const uidReject = "c2-test-reject";
const rejectRef = db.collection("partnerApplications").doc(uidReject);
const userRef = db.collection("users").doc(uidReject);
try {
  // Every identifier below is fictional and exclusively located in demo-motuka-c2 emulators.
  await auth.createUser({ uid: uidReject, email: `${uidReject}@example.test`, password: "LocalDemoOnly-123456" });
  await userRef.set({ role: "user", status: "active", isPartner: false, isTestAccount: true });
  await rejectRef.set({ uid: uidReject, fullName: "Reject Candidate (fictional)", city: "Demo",
    phone: "000000000", status: "pending", decisionVersion: 0, createdAt: new Date(), isTestApplication: true });

  const approved = await decide(uidApprove, "approve", 0);
  assert.equal(approved.status, 200, JSON.stringify(approved.payload));
  assert.equal(approved.payload.status, "approved");
  let [approveApp, approveUser, approveEvents] = await Promise.all([
    db.collection("partnerApplications").doc(uidApprove).get(),
    db.collection("users").doc(uidApprove).get(),
    db.collection("partnerApplications").doc(uidApprove).collection("history").get(),
  ]);
  assert.equal(approveApp.data().decisionVersion, 1);
  assert.equal(approveApp.data().status, "approved");
  assert.equal(approveUser.data().isPartner, true);
  assert.equal(approveEvents.size, 1);
  assert.equal(approveEvents.docs[0].data().action, "approve");
  let detail = await getDetail(uidApprove);
  assert.equal(detail.application.status, "approved");
  assert.equal(detail.partner.isPartner, true);
  assert.ok(detail.history.some(e => e.action === "approve"));
  console.log("PASS admin approval HTTP, partner grant, persistent history");

  const stale = await decide(uidApprove, "approve", 0);
  assert.equal(stale.status, 409);
  assert.equal((await db.collection("partnerApplications").doc(uidApprove).collection("history").get()).size, 1);
  console.log("PASS stale/repeated admin decision returns 409 without duplicate audit");

  const rejected = await decide(uidReject, "reject", 0, "Fictional rejection reason");
  assert.equal(rejected.status, 200, JSON.stringify(rejected.payload));
  const [rejectApp, rejectUser, rejectEvents] = await Promise.all([
    rejectRef.get(), userRef.get(), rejectRef.collection("history").get(),
  ]);
  assert.equal(rejectApp.data().status, "rejected");
  assert.equal(rejectApp.data().decisionVersion, 1);
  assert.equal(rejectApp.data().rejectionReason, "Fictional rejection reason");
  assert.equal(rejectUser.data().isPartner, false);
  assert.equal(rejectEvents.size, 1);
  assert.equal(rejectEvents.docs[0].data().reason, "Fictional rejection reason");
  detail = await getDetail(uidReject);
  assert.equal(detail.application.status, "rejected");
  assert.ok(detail.history.some(e => e.action === "reject"));
  console.log("PASS admin rejection HTTP, partner status unchanged, reason and audit history");

  const repeated = await decide(uidReject, "reject", 0, "Repeat");
  assert.equal(repeated.status, 409);
  console.log("PASS repeated rejection returns 409");
  console.log("C2 write-path integration tests PASS (isolated emulators only)");
} finally {
  // Emulator instance is ephemeral; process exit destroys test data.
}
