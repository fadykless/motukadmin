import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {assertRulesEnvironment, verifiedRulesFixture, assertAdminStillHasNoRules, RULES_PROJECT} from "../../../scripts/whatsapp-rules-guard.mjs";

// All guard/hash/config checks precede loading any Firebase SDK.
assertRulesEnvironment(process.env);
const fixture = await verifiedRulesFixture();
await assertAdminStillHasNoRules();
const {initializeTestEnvironment, assertFails, assertSucceeds} = await import("@firebase/rules-unit-testing");
const {doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, setLogLevel} = await import("firebase/firestore");
setLogLevel("silent");
const collections = ["waDryRunMessages", "waDryRunSessions", "waDryRunSimulatedOutputs", "waDryRunDeliveryReceipts", "waDryRunAdvisorRequests"];
const runId = "wa-rules-" + randomUUID(), owner = runId, user = runId + "-user", staff = runId + "-admin", manager = runId + "-manager", other = runId + "-other";
const fixtureData = {dryRun: true, fixtureOnly: true, user: owner, uid: owner, ownerId: owner, assignedTo: owner, state: "prepared", marker: "fictional-client-rules-test"};
const actors = [
  {name: "anonymous", uid: null}, {name: "user", uid: user, role: "user"},
  {name: "apparent_owner", uid: owner, role: "user"}, {name: "admin", uid: staff, role: "admin"},
  {name: "manager", uid: manager, role: "manager"}, {name: "other_account", uid: other, role: "user"}
];
let environment, denied = 0, positive = 0, regressionDenied = 0;
const ownedPaths = [];
const databaseFor = actor => actor.uid ? environment.authenticatedContext(actor.uid, {role: actor.role, email: `${actor.uid}@example.test`}).firestore() : environment.unauthenticatedContext().firestore();
test.before(async () => {
  environment = await initializeTestEnvironment({projectId: RULES_PROJECT, firestore: {host: "127.0.0.1", port: 8190, rules: fixture.rules}});
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const seed = async (path, value) => {
      assert.equal((await getDoc(doc(db, path))).exists(), false, "fixture collision");
      await setDoc(doc(db, path), value); ownedPaths.push(path);
    };
    for (const name of collections) {
      await seed(`${name}/${runId}`, fixtureData); await seed(`${name}/${runId}/history/${runId}`, fixtureData);
      for (const actor of actors) {
        for (const path of [`${name}/${runId}-new-${actor.name}`, `${name}/${runId}/history/${runId}-new-${actor.name}`]) {
          assert.equal((await getDoc(doc(db, path))).exists(), false, "create-target collision"); ownedPaths.push(path);
        }
      }
    }
    for (const actor of actors.filter(value => value.uid)) await seed(`users/${actor.uid}`, {role: actor.role, status: "active", displayName: "Fictional rules actor", isPartner: false});
    await seed(`products/${runId}`, {user: owner, status: "active", expiresAt: new Date(Date.now() + 3600000), name: "Fictional product", price: 10000});
    await seed(`favorites/${runId}`, {user: owner, productId: runId});
    await seed(`partnerApplications/${runId}`, {userId: owner, status: "pending"});
  });
});
test.after(async () => {
  if (!environment) return;
  // Delete exact seed/reserved create paths only, never clearFirestore/collections.
  try {await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const path of [...ownedPaths].reverse()) await deleteDoc(doc(db, path));
  });} finally {await environment.cleanup();}
  console.log(`SUMMARY client rules: ${denied} internal operations denied; ${positive} positive controls; ${regressionDenied} protected-field/access controls denied. Deployed rules NOT verified.`);
});
for (const actor of actors) {
  test(`${actor.name}: all five internal WhatsApp collections and child histories reject client access`, async () => {
    const db = databaseFor(actor);
    for (const name of collections) {
      const root = `${name}/${runId}`, child = `${root}/history/${runId}`;
      for (const [path, listPath] of [[root, name], [child, `${root}/history`]]) {
        const ref = doc(db, path);
        const checks = [
          () => getDoc(ref),
          () => getDocs(query(collection(db, listPath), where("user", "==", owner))),
          () => setDoc(doc(db, listPath + "/" + runId + "-new-" + actor.name), fixtureData),
          () => updateDoc(ref, {state: "client-mutation"}),
          () => deleteDoc(ref)
        ];
        for (const action of checks) {await assertFails(action()); denied++;}
      }
    }
  });
}
test("canonical public/owner permissions remain meaningful while protected fields stay denied", async () => {
  const anonymous = databaseFor(actors[0]), ownerDb = databaseFor(actors[2]), otherDb = databaseFor(actors[5]), adminDb = databaseFor(actors[3]);
  const succeeds = async action => {await assertSucceeds(action()); positive++;};
  const fails = async action => {await assertFails(action()); regressionDenied++;};
  await succeeds(() => getDoc(doc(anonymous, "products", runId)));
  await succeeds(() => getDocs(collection(anonymous, "products")));
  await succeeds(() => getDoc(doc(ownerDb, "users", owner)));
  await succeeds(() => updateDoc(doc(ownerDb, "users", owner), {displayName: "Fictional updated profile"}));
  await succeeds(() => updateDoc(doc(ownerDb, "products", runId), {price: 11000}));
  await succeeds(() => getDoc(doc(ownerDb, "favorites", runId)));
  await fails(() => updateDoc(doc(ownerDb, "products", runId), {status: "sold"}));
  await fails(() => updateDoc(doc(ownerDb, "products", runId), {user: other}));
  await fails(() => updateDoc(doc(otherDb, "products", runId), {price: 12000}));
  await fails(() => deleteDoc(doc(ownerDb, "products", runId)));
  await fails(() => getDoc(doc(otherDb, "users", owner)));
  await fails(() => updateDoc(doc(ownerDb, "users", owner), {role: "admin"}));
  await fails(() => updateDoc(doc(ownerDb, "users", owner), {isPartner: true}));
  await fails(() => getDoc(doc(otherDb, "favorites", runId)));
  await fails(() => getDoc(doc(adminDb, "partnerApplications", runId)));
  // Prove denied creates/updates/deletes did not change the seeded internals.
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const name of collections) {
      assert.deepEqual((await getDoc(doc(db, name, runId))).data(), fixtureData);
      assert.deepEqual((await getDoc(doc(db, name, runId, "history", runId))).data(), fixtureData);
      for (const actor of actors) {
        assert.equal((await getDoc(doc(db, name, runId + "-new-" + actor.name))).exists(), false);
        assert.equal((await getDoc(doc(db, name, runId, "history", runId + "-new-" + actor.name))).exists(), false);
      }
    }
  });
});
