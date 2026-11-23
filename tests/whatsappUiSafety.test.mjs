import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {assertWhatsAppUiEnvironment, browserRequestAllowed, expectedFontRequest} from "../scripts/whatsapp-ui-guard.mjs";
const safe = {CI: "true", GITHUB_ACTIONS: "true", NODE_ENV: "test", WHATSAPP_UI_TEST_CONFIRMED: "yes", WHATSAPP_ADMIN_DRY_RUN_ENABLED: "true", NEXT_PUBLIC_C2_EMULATOR_MODE: "true", GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", PLAYWRIGHT_RUNTIME_DIR: "/fictional/runtime/node_modules", WHATSAPP_UI_SOURCE_SHA: "a".repeat(40)};
test("UI runner is restricted to confirmed CI demo emulators without service/Meta credentials", () => {
  assert.doesNotThrow(() => assertWhatsAppUiEnvironment(safe));
  for (const patch of [{CI: "false"}, {GITHUB_ACTIONS: "false"}, {NODE_ENV: "production"}, {GCLOUD_PROJECT: "motukapp"}, {WHATSAPP_UI_TEST_CONFIRMED: "no"}, {FIRESTORE_EMULATOR_HOST: "remote:8080"}, {FIREBASE_AUTH_EMULATOR_HOST: "remote:9099"}, {PLAYWRIGHT_RUNTIME_DIR: "relative"}, {WHATSAPP_UI_SOURCE_SHA: "branch"}, {GOOGLE_APPLICATION_CREDENTIALS: "fictional"}, {WHATSAPP_ACCESS_TOKEN: "fictional"}]) assert.throws(() => assertWhatsAppUiEnvironment({...safe, ...patch}), /WHATSAPP_UI_ISOLATION_REQUIRED/);
});
test("unsafe runner invocation exits before SDK, artifacts, browser or Next", () => {
  const result = spawnSync(process.execPath, [new URL("../scripts/run-whatsapp-ui.mjs", import.meta.url).pathname], {env: {...safe, NODE_ENV: "production"}, encoding: "utf8", timeout: 5000});
  assert.equal(result.status, 2); assert.equal(result.stdout, ""); assert.match(result.stderr, /^WHATSAPP_UI_ISOLATION_REQUIRED/);
});
test("browser egress allowlist permits only local app/Auth/Firestore, never public Motuka or Firebase", () => {
  for (const url of ["http://127.0.0.1:3230/auth", "http://localhost:9099/identitytoolkit", "http://127.0.0.1:8080/channel"]) assert.equal(browserRequestAllowed(url), true);
  for (const url of ["https://motukapp.com/marketplace/test", "https://firestore.googleapis.com/", "https://identitytoolkit.googleapis.com/", "http://127.0.0.1:3000", "http://evil.example.test:3230", "file:///tmp/test", "invalid"]) assert.equal(browserRequestAllowed(url), false);
  assert.equal(expectedFontRequest("https://fonts.googleapis.com/css2"), true); assert.equal(browserRequestAllowed("https://fonts.googleapis.com/css2"), false);
  assert.equal(expectedFontRequest("https://fonts.googleapis.com.evil.test"), false);
});
