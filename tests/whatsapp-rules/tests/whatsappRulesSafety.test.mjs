import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp, writeFile, copyFile, rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {pathToFileURL} from "node:url";
import {spawnSync} from "node:child_process";
import {assertRulesEnvironment, verifiedRulesFixture, assertAdminStillHasNoRules, RULES_PROJECT, RULES_HOST} from "../../../scripts/whatsapp-rules-guard.mjs";
const safe = {NODE_ENV: "test", WHATSAPP_RULES_TEST_CONFIRMED: "yes", GCLOUD_PROJECT: RULES_PROJECT, GOOGLE_CLOUD_PROJECT: RULES_PROJECT, FIRESTORE_EMULATOR_HOST: RULES_HOST};
test("rules guard permits only confirmed exact demo project and local emulator", () => {
  assert.doesNotThrow(() => assertRulesEnvironment(safe));
  for (const patch of [{NODE_ENV: "production"}, {WHATSAPP_RULES_TEST_CONFIRMED: "no"}, {GCLOUD_PROJECT: "motukapp"}, {GOOGLE_CLOUD_PROJECT: "other"}, {FIRESTORE_EMULATOR_HOST: "remote:8190"}, {GOOGLE_APPLICATION_CREDENTIALS: "fictional"}, {FIREBASE_SERVICE_ACCOUNT_KEY: "fictional"}]) assert.throws(() => assertRulesEnvironment({...safe, ...patch}), /RULES_TEST_ISOLATION_REQUIRED/);
});
test("client test runner refuses unsafe environment before importing Firebase", () => {
  const result = spawnSync(process.execPath, [new URL("./whatsappClientRules.test.mjs", import.meta.url).pathname], {env: {...safe, NODE_ENV: "production"}, encoding: "utf8", timeout: 5000});
  assert.equal(result.status, 1); assert.match(result.stderr, /RULES_TEST_ISOLATION_REQUIRED/); assert.equal(result.stdout, "");
});
test("rules and source config hashes are pinned and tampering is refused", async () => {
  const value = await verifiedRulesFixture(); assert.equal(value.manifest.marketplace.commit, "9dcd249187ca0209e5da6e3576a0a2be7f12c3ac");
  const temporary = await mkdtemp(join(tmpdir(), "wa-rules-proof-")), base = pathToFileURL(temporary + "/");
  try {
    for (const file of ["marketplace.firestore.rules", "marketplace.firebase.json", "manifest.json"]) await copyFile(new URL("../../fixtures/whatsapp-rules/" + file, import.meta.url), join(temporary, file));
    await writeFile(join(temporary, "marketplace.firestore.rules"), "rules_version = '2'; // tampered\n");
    await assert.rejects(verifiedRulesFixture(base), /RULES_FIXTURE_MISMATCH/);
  } finally {await rm(temporary, {recursive: true, force: true});}
});
test("a newly added Admin production rules/config file requires a fresh audit", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "wa-admin-policy-")), base = pathToFileURL(temporary + "/");
  try {
    await assertAdminStillHasNoRules(base);
    await writeFile(join(temporary, "firebase.json"), "{}");
    await assert.rejects(assertAdminStillHasNoRules(base), /ADMIN_RULES_AUDIT_REQUIRED/);
  } finally {await rm(temporary, {recursive: true, force: true});}
});
