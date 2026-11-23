import test from "node:test";
import assert from "node:assert/strict";
import {assertQueueEnvironment, sourceContext, liveTask} from "../src/lib/server/whatsapp-queue-policy.mjs";
import {createQueueHandlers} from "../src/lib/server/whatsapp-queue-handlers.mjs";
const now = Date.now();
const safe = {NODE_ENV: "test", WHATSAPP_ADMIN_DRY_RUN_ENABLED: "true", NEXT_PUBLIC_C2_EMULATOR_MODE: "true", GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080"};
const context = () => ({schema: "motuka.whatsapp.human-intent.v1", dryRun: true, scope: "general", criteria: {type: "sale", city: "Kinshasa", brand: "Toyota", budgetMax: 12000, currency: "USD", rentType: null}, offer: null});
const source = () => ({dryRun: true, status: "prepared", fingerprint: "a".repeat(64), sessionKey: "b".repeat(64), receivedAt: now, expiresAt: new Date(now + 86400000), draft: {kind: "human_intent", context: context()}});
test("queue is closed unless exact demo/Auth/Firestore environment is confirmed", () => {
  assert.doesNotThrow(() => assertQueueEnvironment(safe));
  for (const patch of [{NODE_ENV: "production"}, {GCLOUD_PROJECT: "motukapp"}, {WHATSAPP_ADMIN_DRY_RUN_ENABLED: "false"}, {GOOGLE_APPLICATION_CREDENTIALS: "fictional"}, {FIRESTORE_EMULATOR_HOST: "remote:8080"}, {FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099"}]) assert.throws(() => assertQueueEnvironment({...safe, ...patch}));
});
test("source validation excludes private fields and expired/incomplete/untrusted contexts", () => {
  assert.deepEqual(sourceContext(source(), now), context());
  for (const mutate of [s => s.draft.context.criteria.model = "PRIVATE", s => s.draft.context.phone = "PRIVATE", s => s.status = "other", s => s.receivedAt = now + 999999, s => s.expiresAt = new Date(now), s => s.fingerprint = "bad", s => s.draft.context.offer = {}, s => s.draft.context.criteria.city = "PRIVATE"]) {
    const value = source(); mutate(value); assert.throws(() => sourceContext(value, now), /INVALID_SOURCE/);
  }
});
test("selected offer URL and public fields must be canonical", () => {
  const value = source(); value.draft.context.scope = "selected";
  value.draft.context.offer = {id: "car1", type: "sale", price: 10000, currency: "USD", url: "https://motukapp.com/marketplace/car1"};
  assert.equal(sourceContext(value, now).offer.id, "car1");
  value.draft.context.offer.url = "https://evil.example.test"; assert.throws(() => sourceContext(value, now));
  value.draft.context.offer.url = "https://motukapp.com/marketplace/car1"; value.draft.context.offer.email = "PRIVATE"; assert.throws(() => sourceContext(value, now));
});
test("corrupt task context/audit/ownership is never considered listable", () => {
  const item = {dryRun: true, fixtureOnly: true, sourceFingerprint: "a".repeat(64), receiptKey: "b".repeat(64), state: "new", version: 0, assignedTo: null, createdAt: now, context: context(), expiresAt: new Date(now + 1000), audit: {imported: {actorId: "test-admin", at: now}, claimed: null, closed: null}};
  assert.equal(liveTask(item, now), true);
  for (const patch of [{context: {...context(), private: "sentinel"}}, {audit: null}, {assignedTo: "someone"}, {version: 2}, {state: "closed"}, {createdAt: {private: "sentinel"}}]) assert.equal(liveTask({...item, ...patch}, now), false);
});
test("guard runs before opening Auth or database", async () => {
  let opened = 0;
  const handler = createQueueHandlers({env: () => ({...safe, NODE_ENV: "production"}), open: async () => {opened++;}});
  assert.equal((await handler.GET(new Request("http://localhost/api"))).status, 503); assert.equal(opened, 0);
});
test("authorization is checked for every method and errors stay fixed", async () => {
  let opened = 0;
  const handlers = createQueueHandlers({env: () => safe, open: async () => {opened++; throw Object.assign(new Error("PRIVATE_TOKEN"), {status: 403});}});
  for (const method of ["GET", "POST", "PATCH"]) {
    const response = await handlers[method](new Request("http://localhost/api", {method}));
    assert.equal(response.status, 403); assert.deepEqual(await response.json(), {error: "ACCESS_DENIED"});
  }
  assert.equal(opened, 3);
});
test("client body cannot supply context, actor or arbitrary status; response is no-store", async () => {
  let writes = 0;
  const handlers = createQueueHandlers({env: () => safe, open: async () => ({staff: {uid: "test-admin", role: "admin"}, store: {ingest: async () => {writes++;}}})});
  const response = await handlers.POST(new Request("http://localhost/api", {method: "POST", body: JSON.stringify({receiptKey: "a".repeat(64), context: context(), actor: "other"})}));
  assert.equal(response.status, 400); assert.equal(writes, 0); assert.equal(response.headers.get("cache-control"), "no-store");
  const large = await handlers.POST(new Request("http://localhost/api", {method: "POST", body: "x".repeat(1100)}));
  assert.equal(large.status, 413); assert.equal(writes, 0);
});
