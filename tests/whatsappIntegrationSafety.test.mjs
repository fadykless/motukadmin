import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp, mkdir, writeFile, symlink, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import net from "node:net";
import {spawnSync} from "node:child_process";
import {assertIntegrationEnvironment, assertPortFree, verifiedSources} from "../scripts/whatsapp-integration-guard.mjs";
const safe = {NODE_ENV: "test", WHATSAPP_INTEGRATION_TEST_CONFIRMED: "yes", WHATSAPP_ADMIN_DRY_RUN_ENABLED: "true", NEXT_PUBLIC_C2_EMULATOR_MODE: "true", GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", MARKETPLACE_SOURCE_DIR: "/fictional/checkout"};
test("integration guard requires exact confirmed demo endpoints and explicit absolute source", () => {
  assert.doesNotThrow(() => assertIntegrationEnvironment(safe));
  for (const patch of [{NODE_ENV: "production"}, {GCLOUD_PROJECT: "motukapp"}, {MARKETPLACE_SOURCE_DIR: "relative"}, {WHATSAPP_INTEGRATION_TEST_CONFIRMED: "no"}, {FIREBASE_AUTH_EMULATOR_HOST: "remote:9099"}, {FIRESTORE_EMULATOR_HOST: "localhost:8080"}, {WHATSAPP_APP_SECRET: "fictional"}, {GOOGLE_APPLICATION_CREDENTIALS: "fictional"}]) assert.throws(() => assertIntegrationEnvironment({...safe, ...patch}), /INTEGRATION_ISOLATION_REQUIRED/);
});
test("runner refuses production environment before source read or SDK", () => {
  const result = spawnSync(process.execPath, [new URL("../scripts/test-whatsapp-integration-http.mjs", import.meta.url).pathname], {env: {...safe, NODE_ENV: "production"}, encoding: "utf8", timeout: 5000});
  assert.equal(result.status, 2); assert.equal(result.stdout, ""); assert.match(result.stderr, /^INTEGRATION_ISOLATION_REQUIRED/);
});
test("source verification rejects code changes, path escape and symlink escape", async () => {
  const root = await mkdtemp(join(tmpdir(), "wa-source-guard-")), outside = await mkdtemp(join(tmpdir(), "wa-source-outside-"));
  try {
    await mkdir(join(root, "src")); await writeFile(join(root, "src/test.mjs"), "export const safe = true;\n");
    const digest = createHash("sha256").update("export const safe = true;\n").digest("hex");
    const spec = {files: {"src/test.mjs": digest}};
    assert.equal(Object.keys(await verifiedSources(root, spec)).length, 1);
    await writeFile(join(root, "src/test.mjs"), "export const unsafe = true;\n");
    await assert.rejects(verifiedSources(root, spec), /SOURCE_HASH_MISMATCH/);
    await assert.rejects(verifiedSources(root, {files: {"src/../test.mjs": digest}}), /INVALID_SOURCE_MANIFEST/);
    await writeFile(join(outside, "test.mjs"), "export const safe = true;\n");
    await symlink(join(outside, "test.mjs"), join(root, "src/link.mjs"));
    await assert.rejects(verifiedSources(root, {files: {"src/link.mjs": digest}}), /SOURCE_OUTSIDE_CHECKOUT/);
  } finally {await rm(root, {recursive: true, force: true}); await rm(outside, {recursive: true, force: true});}
});
test("occupied local port is refused and existing server is never stopped", async () => {
  const server = net.createServer();
  await new Promise((resolve, reject) => {server.once("error", reject); server.listen(0, "127.0.0.1", resolve);});
  try {await assert.rejects(assertPortFree(server.address().port), /INTEGRATION_PORT_OCCUPIED/); assert.equal(server.listening, true);}
  finally {await new Promise(resolve => server.close(resolve));}
});
