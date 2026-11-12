import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const env = { ...process.env, GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_SERVICE_ACCOUNT_JSON: "", GOOGLE_APPLICATION_CREDENTIALS: "", NODE_OPTIONS: "", NODE_PATH: "" };
for (const [name, override] of [
  ["real primary project", { GCLOUD_PROJECT: "real-project" }],
  ["real secondary project", { GOOGLE_CLOUD_PROJECT: "real-project" }],
  ["remote auth", { FIREBASE_AUTH_EMULATOR_HOST: "identitytoolkit.googleapis.com:443" }],
  ["remote firestore", { FIRESTORE_EMULATOR_HOST: "firestore.googleapis.com:443" }],
  ["service account JSON", { FIREBASE_SERVICE_ACCOUNT_JSON: "{}" }],
  ["credential path", { GOOGLE_APPLICATION_CREDENTIALS: "/not-a-real-file.json" }],
]) test(`seed without SDK refuses ${name} before resolution`, () => {
  const dir = mkdtempSync(join(tmpdir(), "motuka-seed-guard-"));
  try {
    const script = join(dir, "seed.mjs");
    copyFileSync(new URL("../scripts/seed-c2-emulator.mjs", import.meta.url), script);
    const result = spawnSync(process.execPath, [script], { cwd: dir, env: { ...env, ...override }, encoding: "utf8", timeout: 5000 });
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /REFUSED/);
    assert.doesNotMatch(result.stderr, /ERR_MODULE_NOT_FOUND/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
