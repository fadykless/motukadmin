import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = new URL("../scripts/seed-c2-emulator.mjs", import.meta.url).pathname;
const baseEnv = {
  ...process.env,
  GCLOUD_PROJECT: "demo-motuka-c2",
  GOOGLE_CLOUD_PROJECT: "demo-motuka-c2",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
};
function run(overrides) {
  return spawnSync(process.execPath, [script], {
    env: { ...baseEnv, ...overrides },
    encoding: "utf8",
    timeout: 10000,
  });
}
test("C2 seed refuses real Firebase project before any network access", () => {
  const result = run({ GCLOUD_PROJECT: "motuka-production" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /REFUSED/);
});
test("C2 seed refuses remote Firestore endpoint", () => {
  const result = run({ FIRESTORE_EMULATOR_HOST: "firestore.googleapis.com:443" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /REFUSED/);
});
test("C2 seed refuses service account credentials", () => {
  const result = run({ FIREBASE_SERVICE_ACCOUNT_JSON: '{"type":"service_account"}' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /REFUSED/);
});
