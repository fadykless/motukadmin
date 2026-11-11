#!/usr/bin/env node
// Integration checks against fictional, local demo accounts only. No production credentials.
import assert from "node:assert/strict";
const required = {
  GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  NEXT_PUBLIC_C2_EMULATOR_MODE: "true", ADMIN_BASE_URL: "http://127.0.0.1:3100/",
};
for (const [key, value] of Object.entries(required)) if (process.env[key] !== value) throw Error(`Unsafe prospect test: ${key}`);
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS) throw Error("Credentials forbidden");
for (const key of ["ADMIN_ID_TOKEN", "MANAGER_ID_TOKEN", "USER_ID_TOKEN"]) if (!process.env[key]) throw Error(`Missing fictional token: ${key}`);
const { initializeApp } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const db = getFirestore(initializeApp({ projectId: required.GCLOUD_PROJECT }));
const path = "/api/admin/contact-requests/c2-test-prospect";
const ref = db.collection("contactRequests").doc("c2-test-prospect");
await db.collection("users").doc("c2-test-prospect-partner").set({ isPartner: true, role: "user", status: "active", isTestAccount: true });
await db.collection("products").doc("c2-test-prospect-car").set({ listingOrigin: "commissionnaire", commissionnaireId: "c2-test-prospect-partner", name: "Fictional car" });
await ref.set({ contactChannel: "motuka", productId: "c2-test-prospect-car", buyerId: "c2-test-user",
  commissionnaireId: "c2-test-prospect-partner", assignedTo: "c2-test-admin", status: "new", createdAt: new Date() });
const admin = process.env.ADMIN_ID_TOKEN, manager = process.env.MANAGER_ID_TOKEN, user = process.env.USER_ID_TOKEN;
async function request(urlPath, token, body) {
  return fetch(new URL(urlPath, required.ADMIN_BASE_URL), {
    method: body ? "PATCH" : "GET", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), redirect: "error", signal: AbortSignal.timeout(20000),
  });
}
for (const [token, expected] of [[null, 401], ["invalid", 401], [user, 403]]) {
  for (const urlPath of [path, "/api/admin/contact-requests", "/api/admin/contact-requests/staff"]) {
    assert.equal((await request(urlPath, token)).status, expected);
  }
  assert.equal((await request(path, token, { status: "contacted", expectedVersion: 0 })).status, expected);
}
console.log("PASS prospects anonymous/invalid/user rejected on list, detail, staff and writes");
for (const token of [admin, manager]) {
  const response = await request(path, token);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal((await response.json()).prospect.version, 0);
}
assert.equal((await request(path, admin, { status: "contacted" })).status, 400);
for (const patch of [{ productId: "foreign" }, { buyerId: "foreign" }, { commissionnaireId: "foreign" }, { verifiedSale: true }, { commissionDue: 5 }]) {
  assert.equal((await request(path, admin, { expectedVersion: 0, ...patch })).status, 400);
}
assert.equal((await ref.collection("history").get()).size, 0);
console.log("PASS prospects immutable identities and forbidden sale/financial fields rejected without audit");
assert.equal((await request(path, manager, { assignedTo: null, expectedVersion: 0 })).status, 200);
const unassigned = await ref.get(), firstAudit = await ref.collection("history").get();
assert.equal(unassigned.get("assignedTo"), null);
assert.equal(unassigned.get("version"), 1);
assert.equal(firstAudit.size, 1);
assert.equal(firstAudit.docs[0].get("before.assignedTo"), "c2-test-admin");
assert.equal(firstAudit.docs[0].get("after.assignedTo"), null);
assert.equal(firstAudit.docs[0].get("actorId"), "c2-test-manager");
console.log("PASS preserved manager role, unassignment and matching transactional audit");
const race = await Promise.all([
  request(path, admin, { status: "qualified", expectedVersion: 1 }),
  request(path, manager, { status: "contacted", expectedVersion: 1 }),
]);
assert.deepEqual(race.map(r => r.status).sort(), [200, 409]);
assert.equal((await ref.get()).get("version"), 2);
assert.equal((await ref.collection("history").get()).size, 2);
assert.equal((await request(path, admin, { status: "closed", closedReason: "completed", expectedVersion: 1 })).status, 409);
assert.equal((await ref.collection("history").get()).size, 2);
console.log("PASS one concurrent update wins; stale retry writes no duplicate event");
await db.collection("contactRequests").doc("c2-test-foreign-prospect").set({ contactChannel: "external", productId: "c2-test-prospect-car",
  buyerId: "c2-test-user", commissionnaireId: "c2-test-prospect-partner", createdAt: new Date(), status: "new" });
const foreignPath = "/api/admin/contact-requests/c2-test-foreign-prospect";
assert.equal((await request(foreignPath, user)).status, 403);
assert.equal((await request(foreignPath, admin)).status, 404);
assert.equal((await request(foreignPath, admin, { status: "contacted", expectedVersion: 0 })).status, 409);
assert.equal((await db.collection("contactRequests").doc("c2-test-foreign-prospect").collection("history").get()).size, 0);
console.log("PASS out-of-scope prospect refused without mutation; partner-facing scope remains unimplemented");
console.log("Prospects HTTP integration PASS (legacy fixture only; new referral contract not activated)");
