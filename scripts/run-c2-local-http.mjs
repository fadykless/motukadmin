#!/usr/bin/env node
// End-to-end C2 authorization smoke test: isolated emulators only.
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
const required = {
  GCLOUD_PROJECT: "demo-motuka-c2",
  GOOGLE_CLOUD_PROJECT: "demo-motuka-c2",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  NEXT_PUBLIC_C2_EMULATOR_MODE: "true",
};
for (const [key, value] of Object.entries(required)) {
  if (process.env[key] !== value) throw Error(`Unsafe C2 environment: ${key}`);
}
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw Error("Service credentials forbidden in isolated C2 recipe");
}
const seed = spawnSync(process.execPath, ["scripts/seed-c2-emulator.mjs"], {
  stdio: "inherit", env: process.env, timeout: 30000,
});
if (seed.status !== 0) throw Error(`C2 seed failed: ${seed.status}`);
async function token(uid) {
  const url = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `${uid}@example.test`, password: "LocalDemoOnly-123456", returnSecureToken: true }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error(`Fictional Auth sign-in failed for ${uid}: HTTP ${response.status}`);
  const result = await response.json();
  if (!result.idToken) throw Error("Auth Emulator did not return an ID token");
  return result.idToken;
}
const [admin, manager, user] = await Promise.all([
  token("c2-test-admin"), token("c2-test-manager"), token("c2-test-user"),
]);
const server = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3100"], {
  env: process.env, stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
server.stdout.on("data", chunk => { output = (output + chunk.toString()).slice(-5000); });
server.stderr.on("data", chunk => { output = (output + chunk.toString()).slice(-5000); });
try {
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null) throw Error(`Next server exited: ${output}`);
    try {
      const response = await fetch("http://127.0.0.1:3100/", { signal: AbortSignal.timeout(1500) });
      if (response.status < 500) { ready = true; break; }
    } catch {}
    await sleep(1000);
  }
  if (!ready) throw Error(`Next server not ready: ${output}`);
  const result = spawnSync(process.execPath, ["scripts/test-admin-access.mjs"], {
    env: {
      ...process.env,
      ADMIN_BASE_URL: "http://127.0.0.1:3100/",
      ADMIN_ID_TOKEN: admin,
      MANAGER_ID_TOKEN: manager,
      USER_ID_TOKEN: user,
    },
    stdio: "inherit", timeout: 180000,
  });
  if (result.status !== 0) throw Error(`C2 HTTP smoke test failed: ${result.status}`);
  console.log("C2 HTTP smoke test PASS (isolated Auth and Firestore emulators)");
} finally {
  server.kill("SIGTERM");
}
