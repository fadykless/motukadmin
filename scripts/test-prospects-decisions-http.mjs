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
// Equal timestamps exercise the document-ID tiebreaker, not just date ordering.
const pageIds = ["c2-test-page-a", "c2-test-page-b", "c2-test-page-c"];
const batch = db.batch();
for (const id of pageIds) batch.set(db.collection("contactRequests").doc(id), {
  contactChannel: "motuka", productId: "c2-test-prospect-car", buyerId: "c2-test-user",
  commissionnaireId: "c2-test-prospect-partner", assignedTo: "c2-test-admin",
  status: "in_progress", createdAt: new Date("2026-11-10T12:00:00Z"),
});
// A newer out-of-scope document must not consume a visible page slot.
batch.set(db.collection("contactRequests").doc("c2-test-page-invalid"), {
  contactChannel: "motuka", productId: "c2-test-missing-car", buyerId: "c2-test-user",
  commissionnaireId: "c2-test-prospect-partner", assignedTo: "c2-test-admin",
  status: "in_progress", createdAt: new Date("2026-11-10T13:00:00Z"),
});
await batch.commit();
const filters = "status=in_progress&productId=c2-test-prospect-car&commissionnaireId=c2-test-prospect-partner&assignedTo=c2-test-admin&from=2026-11-10&to=2026-11-10";
for (const actor of [admin, manager]) {
  const seen = [], cursors = new Set();
  let cursor = null;
  for (let page = 0; page < 5; page++) {
    const response = await request(`/api/admin/contact-requests?${filters}&limit=1${cursor ? "&cursor=" + cursor : ""}`, actor);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /no-store/);
    const payload = await response.json();
    assert.ok(payload.items.length <= 1);
    seen.push(...payload.items.map(item => item.id));
    if (!payload.nextCursor) break;
    assert.equal(cursors.has(payload.nextCursor), false, "cursor must advance");
    cursors.add(payload.nextCursor); cursor = payload.nextCursor;
  }
  assert.deepEqual(seen, [...pageIds].reverse(), "equal-date pages must neither duplicate nor skip documents");
}
const unfiltered = await request("/api/admin/contact-requests?status=in_progress&limit=2", admin);
assert.equal(unfiltered.status, 200);
assert.deepEqual((await unfiltered.json()).items.map(item => item.id), ["c2-test-page-c", "c2-test-page-b"]);
for (const query of [
  "limit=0", "limit=51", "from=2026-02-30", "from=2026-11-11&to=2026-11-10",
  "cursor=c2-test-page-absent", "status=new&cursor=c2-test-page-a",
  "from=2026-11-11&cursor=c2-test-page-a",
]) assert.equal((await request("/api/admin/contact-requests?" + query, admin)).status, 400, query);
const emptyResponse = await request("/api/admin/contact-requests?status=closed", manager);
assert.equal(emptyResponse.status, 200);
const emptyPage = await emptyResponse.json();
assert.deepEqual(emptyPage.items, []);
assert.equal(emptyPage.nextCursor, null);
console.log("PASS legacy filters, same-timestamp pagination, excluded references, invalid cursors/dates and empty result");
console.log("Prospects HTTP integration PASS (legacy fixture only; new referral contract not activated)");
