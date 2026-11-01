import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const script = new URL("../scripts/test-admin-access.mjs", import.meta.url).pathname;
const tokens = { ADMIN_ID_TOKEN: "fictional-admin", MANAGER_ID_TOKEN: "fictional-manager", USER_ID_TOKEN: "fictional-user" };
function check(env) {
  return spawnSync(process.execPath, [script], {
    env: { ...process.env, ...tokens, ...env },
    encoding: "utf8",
    timeout: 10000,
  });
}
test("HTTP smoke test rejects production host before network", () => {
  const result = check({ ADMIN_BASE_URL: "https://motukadmin.vercel.app/", ADMIN_STAGING_HOST: "motukadmin.vercel.app", ADMIN_STAGING_CONFIRMED: "yes" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Production targets are forbidden/);
});
test("HTTP smoke test rejects localhost without demo emulator variables", () => {
  const result = check({
    ADMIN_BASE_URL: "http://127.0.0.1:3000/",
    GCLOUD_PROJECT: "real-project",
    GOOGLE_CLOUD_PROJECT: "real-project",
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Only explicitly confirmed/);
});
test("HTTP smoke test rejects arbitrary HTTP host", () => {
  const result = check({ ADMIN_BASE_URL: "http://example.com/", ADMIN_STAGING_HOST: "example.com", ADMIN_STAGING_CONFIRMED: "yes" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Only explicitly confirmed/);
});
