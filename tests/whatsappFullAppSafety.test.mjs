import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp, mkdir, writeFile, readFile, rm, symlink} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import net from "node:net";
import {assertFullAppEnvironment, verifyFullSource, verifyDependencies, assertPortFree} from "../scripts/whatsapp-full-app-guard.mjs";
const safe = {NODE_ENV: "test", WHATSAPP_FULL_APP_TEST_CONFIRMED: "yes", WHATSAPP_ADMIN_DRY_RUN_ENABLED: "true", NEXT_PUBLIC_C2_EMULATOR_MODE: "true", GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", ADMIN_SOURCE_DIR: "/fictional/admin", MARKETPLACE_SOURCE_DIR: "/fictional/marketplace"};
test("full-app guard requires exact demo, explicit two sources and no real credentials", () => {
  assert.doesNotThrow(() => assertFullAppEnvironment(safe));
  for (const patch of [{NODE_ENV: "production"}, {GCLOUD_PROJECT: "motukapp"}, {WHATSAPP_FULL_APP_TEST_CONFIRMED: "no"}, {ADMIN_SOURCE_DIR: "relative"}, {MARKETPLACE_SOURCE_DIR: ""}, {ADMIN_DEPENDENCIES_DIR: "relative"}, {GOOGLE_APPLICATION_CREDENTIALS: "fictional"}, {WHATSAPP_APP_SECRET: "fictional"}, {FIRESTORE_EMULATOR_HOST: "remote:8080"}]) assert.throws(() => assertFullAppEnvironment({...safe, ...patch}), /FULL_APP_ISOLATION_REQUIRED/);
});
test("runner rejects production before source reads, Firebase imports or spawn", () => {
  const result = spawnSync(process.execPath, [new URL("../scripts/test-whatsapp-full-app-http.mjs", import.meta.url).pathname], {env: {...safe, NODE_ENV: "production"}, timeout: 5000, encoding: "utf8"});
  assert.equal(result.status, 2); assert.equal(result.stdout, ""); assert.match(result.stderr, /^FULL_APP_ISOLATION_REQUIRED/);
});
test("new manifest covers complete pinned source including Firebase Admin helpers", async () => {
  const value = JSON.parse(await readFile(new URL("./whatsapp-full-app-sources.json", import.meta.url), "utf8"));
  assert.equal(Object.keys(value.marketplace.files).length, 210); assert.equal(Object.keys(value.admin.files).length, 139);
  assert.equal(value.marketplace.omitted.length, 2); assert.deepEqual(value.admin.omitted, []);
  for (const source of [value.marketplace, value.admin]) for (const path of ["package.json", "package-lock.json", "next.config.mjs", "src/app/layout.js"]) assert.ok(source.files[path]);
  assert.ok(value.marketplace.files["src/firebase/admin-accessors.mjs"]); assert.ok(value.marketplace.files["src/firebase/admin.js"]);
});
test("all source bytes must match and symlinks, sensitive files and path escapes are refused", async () => {
  const root = await mkdtemp(join(tmpdir(), "wa-full-source-")), outside = await mkdtemp(join(tmpdir(), "wa-full-outside-"));
  const bytes = Buffer.from("export const fixture = true;\n");
  const meta = {sha256: createHash("sha256").update(bytes).digest("hex"), gitBlobSha: createHash("sha1").update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest("hex"), bytes: bytes.length, mode: "100644"};
  const files = Object.fromEntries(Array.from({length: 139}, (_, n) => ["src/test" + n + ".mjs", meta]));
  const manifest = {schema: "motuka.whatsapp.full-app-sources.v1", admin: {repo: "fadykless/motukadmin", sha: "3ffea5e879621991e790b3f123a49a0756d01bd1", trackedBlobs: 139, omitted: [], files}};
  try {
    await mkdir(join(root, "src")); for (const path of Object.keys(files)) await writeFile(join(root, path), bytes);
    assert.equal(Object.keys((await verifyFullSource("admin", root, manifest)).files).length, 139);
    await writeFile(join(root, "src/test0.mjs"), "changed"); await assert.rejects(verifyFullSource("admin", root, manifest), /FULL_APP_SOURCE_MISMATCH/);
    await rm(join(root, "src/test0.mjs")); await writeFile(join(outside, "file.mjs"), bytes); await symlink(join(outside, "file.mjs"), join(root, "src/test0.mjs"));
    await assert.rejects(verifyFullSource("admin", root, manifest), /FULL_APP_SOURCE_ESCAPE/);
    for (const path of [".env.local", "../escape.mjs", ".next/cache/file.js", "node_modules/test.js", "private.key"]) {
      const altered = {...manifest, admin: {...manifest.admin, files: {[path]: meta, ...Object.fromEntries(Object.entries(files).slice(1))}}};
      await assert.rejects(verifyFullSource("admin", root, altered), /FULL_APP_MANIFEST_MISMATCH/);
    }
  } finally {await rm(root, {recursive: true, force: true}); await rm(outside, {recursive: true, force: true});}
});
test("resolved application dependencies must equal the pinned source lock versions", async () => {
  const root = await mkdtemp(join(tmpdir(), "wa-full-dependencies-")), packages = {};
  try {
    for (const name of ["next", "react", "react-dom", "firebase", "firebase-admin", "@mui/material"]) {
      await mkdir(join(root, name), {recursive: true}); await writeFile(join(root, name, "package.json"), JSON.stringify({version: "1.0.0"})); packages["node_modules/" + name] = {version: "1.0.0"};
    }
    await mkdir(join(root, "next/dist/bin"), {recursive: true}); await writeFile(join(root, "next/dist/bin/next"), "// not executed\n");
    const source = {files: {"package-lock.json": {bytes: Buffer.from(JSON.stringify({packages}))}}};
    assert.equal((await verifyDependencies(root, source)).versions.next, "1.0.0");
    await writeFile(join(root, "react/package.json"), JSON.stringify({version: "2.0.0"}));
    await assert.rejects(verifyDependencies(root, source), /FULL_APP_DEPENDENCY_MISMATCH/);
  } finally {await rm(root, {recursive: true, force: true});}
});
test("occupied loopback port is refused without stopping its existing server", async () => {
  const server = net.createServer(); await new Promise((resolve, reject) => {server.once("error", reject); server.listen(0, "127.0.0.1", resolve);});
  try {await assert.rejects(assertPortFree(server.address().port), /INTEGRATION_PORT_OCCUPIED/); assert.equal(server.listening, true);}
  finally {await new Promise(resolve => server.close(resolve));}
});
