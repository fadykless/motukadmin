import assert from "node:assert/strict";
import {randomUUID, createHash} from "node:crypto";
import {mkdtemp, mkdir, cp, writeFile, symlink, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import net from "node:net";
import {assertQueueEnvironment} from "../src/lib/server/whatsapp-queue-policy.mjs";
assertQueueEnvironment(process.env);
const root = fileURLToPath(new URL("../", import.meta.url)), require = createRequire(import.meta.url);
const projectId = "demo-motuka-c2", runId = randomUUID(), port = 3220, base = `http://127.0.0.1:${port}`;
async function portFree() {
  const probe = net.createServer();
  try {await new Promise((resolve, reject) => {probe.once("error", reject); probe.listen(port, "127.0.0.1", resolve);});}
  finally {if (probe.listening) await new Promise(resolve => probe.close(resolve));}
}
await portFree();
const {initializeApp, deleteApp} = await import("firebase-admin/app"), {getFirestore} = await import("firebase-admin/firestore"), {getAuth} = await import("firebase-admin/auth");
const app = initializeApp({projectId}, "wa-admin-http-" + runId), db = getFirestore(app), auth = getAuth(app);
db.settings({host: "127.0.0.1:8080", ssl: false});
const refs = [], actors = [], now = Date.now();
let fixture, child, checks = 0, cleanupPromise;
function cleanup() {
  return cleanupPromise ??= (async () => {
    if (child?.pid) {
      try {process.kill(-child.pid, "SIGTERM");} catch (e) {if (e.code !== "ESRCH") throw e;}
      for (let n = 0; n < 100 && child.exitCode === null && child.signalCode === null; n++) await delay(50);
      try {process.kill(-child.pid, "SIGKILL");} catch (e) {if (e.code !== "ESRCH") throw e;}
    }
    await Promise.all(refs.map(ref => ref.delete()));
    await Promise.all(actors.map(uid => auth.deleteUser(uid))); await deleteApp(app);
    if (fixture) await rm(fixture, {recursive: true, force: true}); await portFree();
    console.log("CLEANUP exact fictional documents/users/temp and owned Next group only");
  })();
}
for (const [signal, code] of [["SIGINT", 130], ["SIGTERM", 143]]) process.once(signal, () => {void cleanup().finally(() => process.exit(code));});
const expect = (condition, message) => {assert.ok(condition, message); checks++;};
const hash = name => createHash("sha256").update(runId + name).digest("hex");
const alive = () => {if (!child || child.exitCode !== null || child.signalCode !== null) throw Error("OWNED_SERVER_EXITED"); process.kill(child.pid, 0);};
async function call(path, method = "GET", token, data) {
  alive();
  const response = await fetch(base + "/api/admin/whatsapp-requests" + path, {method, redirect: "error", signal: AbortSignal.timeout(10000),
    headers: {...(token ? {Authorization: "Bearer " + token} : {}), ...(data ? {"Content-Type": "application/json"} : {})}, ...(data ? {body: JSON.stringify(data)} : {})});
  const result = await response.json(); alive(); return {status: response.status, result, cache: response.headers.get("cache-control")};
}
async function actor(role, options = {}) {
  const uid = "wa-admin-" + runId + "-" + actors.length, email = uid + "@example.test", password = "FictionalLocalOnly123!";
  await auth.createUser({uid, email, password}); actors.push(uid);
  const ref = db.collection("users").doc(uid); await ref.create({role, status: options.blocked ? "blocked" : "active", isTestAccount: true}); refs.push(ref);
  const response = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key", {
    method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email, password, returnSecureToken: true}), signal: AbortSignal.timeout(10000)});
  assert.equal(response.status, 200); const token = (await response.json()).idToken;
  if (options.disabled) await auth.updateUser(uid, {disabled: true});
  return {uid, token};
}
const context = () => ({schema: "motuka.whatsapp.human-intent.v1", dryRun: true, scope: "general", criteria: {type: "sale", city: "Kinshasa", brand: "Toyota", budgetMax: 12000, currency: "USD", rentType: null}, offer: null});
async function source(name, patch = {}) {
  const key = hash(name), ref = db.collection("waDryRunMessages").doc(key);
  await ref.create({dryRun: true, status: "prepared", fingerprint: hash(name + "fp"), sessionKey: hash(name + "session"), receivedAt: now,
    expiresAt: new Date(now + 3600000), draft: {kind: "human_intent", context: context()}, ...patch});
  refs.push(ref); const target = db.collection("waDryRunAdvisorRequests").doc(key); assert.equal((await target.get()).exists, false); refs.push(target); return {key, ref, target};
}
try {
  const admin = await actor("admin"), manager = await actor("manager"), user = await actor("user"), blocked = await actor("admin", {blocked: true}), disabled = await actor("admin", {disabled: true});
  fixture = await mkdtemp(join(tmpdir(), "motuka-admin-wa-"));
  await mkdir(join(fixture, "src/lib"), {recursive: true}); await mkdir(join(fixture, "src/app/api/admin"), {recursive: true});
  await cp(join(root, "src/lib/server"), join(fixture, "src/lib/server"), {recursive: true});
  await cp(join(root, "src/app/api/admin/whatsapp-requests"), join(fixture, "src/app/api/admin/whatsapp-requests"), {recursive: true});
  await writeFile(join(fixture, "package.json"), JSON.stringify({name: "admin-wa-http-fixture", private: true, type: "module"}));
  await writeFile(join(fixture, "jsconfig.json"), JSON.stringify({compilerOptions: {baseUrl: ".", paths: {"@/*": ["./src/*"]}}}));
  await writeFile(join(fixture, "src/app/layout.js"), 'import {createElement} from "react"; export default function Layout({children}) {return createElement("html",null,createElement("body",null,children));}');
  await writeFile(join(fixture, "src/app/page.js"), "export default function Page(){return null;}");
  await writeFile(join(fixture, "next.config.mjs"), "export default {experimental:{cpus:1}};");
  await symlink(dirname(dirname(require.resolve("next/package.json"))), join(fixture, "node_modules"), "dir");
  const env = {PATH: process.env.PATH || "", NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1"};
  for (const key of ["WHATSAPP_ADMIN_DRY_RUN_ENABLED", "NEXT_PUBLIC_C2_EMULATOR_MODE", "GCLOUD_PROJECT", "GOOGLE_CLOUD_PROJECT", "FIREBASE_AUTH_EMULATOR_HOST", "FIRESTORE_EMULATOR_HOST"]) env[key] = process.env[key];
  child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", fixture, "--webpack", "--hostname", "127.0.0.1", "--port", String(port)], {cwd: fixture, env, stdio: "ignore", detached: true});
  child.on("error", () => {});
  let ready = false; const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {alive(); try {ready = (await call("", "GET")).status === 401;} catch {alive();} if (ready) break; await delay(100);}
  expect(ready, "real Next route must be ready");
  expect((await call("", "GET", user.token)).status === 403, "nonstaff forbidden");
  expect((await call("", "GET", blocked.token)).status === 403, "blocked profile forbidden");
  expect([401, 403].includes((await call("", "GET", disabled.token)).status), "disabled Auth forbidden");
  const src = await source("one");
  expect((await call("", "POST", user.token, {receiptKey: src.key})).status === 403, "user cannot import");
  expect(!(await src.target.get()).exists, "forbidden import writes nothing");
  expect((await call("", "POST", admin.token, {receiptKey: src.key, context: {phone: "PRIVATE"}})).status === 400, "client context forbidden");
  const imports = await Promise.all([call("", "POST", admin.token, {receiptKey: src.key}), call("", "POST", manager.token, {receiptKey: src.key})]);
  expect(imports.every(r => r.status === 200) && imports.filter(r => r.result.created).length === 1, "concurrent import exactly once");
  const first = await src.target.get();
  expect((await call("", "POST", admin.token, {receiptKey: src.key})).result.created === false, "reimport no-op");
  expect((await src.target.get()).updateTime.isEqual(first.updateTime), "no audit on reimport");
  const claims = await Promise.all([call("/" + src.key, "PATCH", admin.token, {action: "claim", expectedVersion: 0}), call("/" + src.key, "PATCH", manager.token, {action: "claim", expectedVersion: 0})]);
  expect(claims.filter(r => r.status === 200).length === 1 && claims.filter(r => r.status === 409).length === 1, "concurrent claim exactly one owner");
  const task = (await src.target.get()).data(), owner = task.assignedTo === admin.uid ? admin : manager, other = owner === admin ? manager : admin;
  const claimSnapshot = await src.target.get();
  expect((await call("/" + src.key, "PATCH", owner.token, {action: "claim", expectedVersion: 0})).result.changed === false, "claim retry no-op");
  expect((await src.target.get()).updateTime.isEqual(claimSnapshot.updateTime), "claim retry preserves audit");
  expect((await call("/" + src.key, "PATCH", other.token, {action: "close", expectedVersion: 1})).status === 409, "only current owner can close");
  expect((await call("/" + src.key, "PATCH", owner.token, {action: "close", expectedVersion: 0})).status === 409, "stale close forbidden");
  expect((await call("/" + src.key, "PATCH", owner.token, {action: "close", expectedVersion: 1})).result.item.state === "closed", "owner closes");
  const closedSnapshot = await src.target.get();
  expect((await call("/" + src.key, "PATCH", owner.token, {action: "close", expectedVersion: 1})).result.changed === false, "close retry no-op");
  expect((await src.target.get()).updateTime.isEqual(closedSnapshot.updateTime), "close retry preserves audit");
  expect((await call("/" + src.key, "PATCH", owner.token, {action: "claim", expectedVersion: 2})).status === 409, "closed task cannot reopen");
  const expired = await source("expired", {expiresAt: new Date(now - 1)});
  expect((await call("", "POST", admin.token, {receiptKey: expired.key})).status === 400, "expired source forbidden");
  expect(!(await expired.target.get()).exists, "expired source creates no task");
  const corrupt = await source("corrupt"); await call("", "POST", admin.token, {receiptKey: corrupt.key});
  await corrupt.target.update({"context.private": "PRIVATE_SENTINEL"});
  const listed = await call("?limit=20", "GET", admin.token);
  expect(listed.status === 200 && listed.cache === "no-store", "authorized list no-store");
  expect(!listed.result.items.some(item => item.id === corrupt.key) && !JSON.stringify(listed.result).includes("PRIVATE_SENTINEL"), "corrupt task hidden without PII");
  expect((await call("/" + corrupt.key, "PATCH", admin.token, {action: "claim", expectedVersion: 0})).status === 404, "corrupt task cannot mutate");
  await src.target.update({expiresAt: new Date(Date.now() - 1)});
  expect(!(await call("", "GET", manager.token)).result.items.some(item => item.id === src.key), "expired task hidden");
  expect((await call("/" + src.key, "PATCH", owner.token, {action: "close", expectedVersion: 1})).status === 404, "expired retry refused");
  console.log(`PASS ${checks} real HTTP Auth/Firestore checks — fictional users, no Meta or real data`);
} catch {
  console.error("WHATSAPP_QUEUE_HTTP_FAILED — raw errors and tokens are not logged"); process.exitCode = 1;
} finally {
  await cleanup();
}
