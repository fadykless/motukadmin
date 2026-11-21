import assert from "node:assert/strict";
import {URLSearchParams} from "node:url";
import {randomUUID, randomBytes, createHmac} from "node:crypto";
import {readFile, mkdtemp, mkdir, writeFile, symlink, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {assertIntegrationEnvironment, assertPortFree, verifiedSources, ADMIN_PORT, MARKETPLACE_PORT} from "./whatsapp-integration-guard.mjs";
// No SDK, fixture creation, or child process before all checks and source hashes.
try {assertIntegrationEnvironment(process.env);} catch {console.error("INTEGRATION_ISOLATION_REQUIRED"); process.exit(2);}
const root = fileURLToPath(new URL("../", import.meta.url)), require = createRequire(import.meta.url);
let sources;
try {
  const manifest = JSON.parse(await readFile(new URL("../tests/whatsapp-integration-sources.json", import.meta.url), "utf8"));
  if (manifest.schema !== "motuka.whatsapp.integration-sources.v1" || manifest.marketplace.repo !== "fadykless/motuka" || manifest.marketplace.sha !== "37741ef53cab91225dccaee7a33ed10836051647" ||
      manifest.admin.repo !== "fadykless/motukadmin" || manifest.admin.sha !== "a89801947dbe39065476457cbb4cc7eb6debf5cd") throw Error("SOURCE_MANIFEST_MISMATCH");
  sources = {admin: await verifiedSources(root, manifest.admin), marketplace: await verifiedSources(process.env.MARKETPLACE_SOURCE_DIR, manifest.marketplace)};
  await assertPortFree(ADMIN_PORT); await assertPortFree(MARKETPLACE_PORT);
} catch (error) {console.error(["INTEGRATION_PORT_OCCUPIED", "SOURCE_HASH_MISMATCH"].includes(error.message) ? error.message : "SOURCE_VERIFICATION_FAILED"); process.exit(2);}
const {initializeApp, deleteApp} = await import("firebase-admin/app"), {getFirestore} = await import("firebase-admin/firestore"), {getAuth} = await import("firebase-admin/auth");
const projectId = "demo-motuka-c2", runId = randomUUID(), model = "I" + runId;
const app = initializeApp({projectId}, "wa-integration-" + runId), db = getFirestore(app), auth = getAuth(app);
db.settings({host: "127.0.0.1:8080", ssl: false});
const fake = {WHATSAPP_DRY_RUN_ENABLED: "true", WHATSAPP_TEST_PROJECT_ID: projectId, WHATSAPP_TEST_WABA_ID: "1001", WHATSAPP_TEST_PHONE_NUMBER_ID: "2001",
  WHATSAPP_VERIFY_TOKEN: randomBytes(32).toString("hex"), WHATSAPP_APP_SECRET: randomBytes(32).toString("hex"), WHATSAPP_SESSION_HASH_SECRET: randomBytes(32).toString("hex")};
const refs = new Map(), actors = [], children = [], fixtures = [];
let sequence = 0, checks = 0, cleanupPromise;
const expect = (condition, label) => {assert.ok(condition, label); checks++;};
function alive(child) {if (!child || child.exitCode !== null || child.signalCode !== null) throw Error("OWNED_SERVER_EXITED"); process.kill(child.pid, 0);}
function cleanup() {
  return cleanupPromise ??= (async () => {
    for (const child of children) {
      try {process.kill(-child.pid, "SIGTERM");} catch (e) {if (e.code !== "ESRCH") throw e;}
      for (let n = 0; n < 100 && child.exitCode === null && child.signalCode === null; n++) await delay(50);
      try {process.kill(-child.pid, "SIGKILL");} catch (e) {if (e.code !== "ESRCH") throw e;}
    }
    await Promise.all([...refs.values()].map(ref => ref.delete()));
    await Promise.all(actors.map(uid => auth.deleteUser(uid))); await deleteApp(app);
    await Promise.all(fixtures.map(path => rm(path, {recursive: true, force: true})));
    await assertPortFree(ADMIN_PORT); await assertPortFree(MARKETPLACE_PORT);
    console.log("CLEANUP exact fictional records/users and both owned Next groups only");
  })();
}
for (const [signal, code] of [["SIGINT", 130], ["SIGTERM", 143]]) process.once(signal, () => {void cleanup().finally(() => process.exit(code));});
async function reserve(collection, id) {
  const ref = db.collection(collection).doc(id);
  if (!refs.has(ref.path)) {assert.equal((await ref.get()).exists, false); refs.set(ref.path, ref);}
  return ref;
}
async function actor(role) {
  const uid = "wa-integration-" + runId + "-" + actors.length, email = uid + "@example.test", password = "FictionalIntegration123!";
  await auth.createUser({uid, email, password}); actors.push(uid);
  const ref = db.collection("users").doc(uid); await ref.create({role, status: "active", isTestAccount: true}); refs.set(ref.path, ref);
  const response = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key", {
    method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email, password, returnSecureToken: true}), signal: AbortSignal.timeout(10000)});
  assert.equal(response.status, 200); return {uid, token: (await response.json()).idToken};
}
async function start(name, port, extraEnv) {
  const fixture = await mkdtemp(join(tmpdir(), "motuka-wa-integration-" + name + "-")); fixtures.push(fixture);
  for (const [path, bytes] of Object.entries(sources[name])) {await mkdir(dirname(join(fixture, path)), {recursive: true}); await writeFile(join(fixture, path), bytes);}
  await writeFile(join(fixture, "package.json"), JSON.stringify({name: "motuka-wa-integration-" + name, private: true, type: "module"}));
  await writeFile(join(fixture, "jsconfig.json"), JSON.stringify({compilerOptions: {baseUrl: ".", paths: {"@/*": ["./src/*"]}}}));
  await writeFile(join(fixture, "src/app/layout.js"), 'import {createElement} from "react"; export default function Layout({children}) {return createElement("html",null,createElement("body",null,children));}');
  await writeFile(join(fixture, "src/app/page.js"), "export default function Page(){return null;}");
  await writeFile(join(fixture, "next.config.mjs"), "export default {experimental:{cpus:1}};");
  await symlink(dirname(dirname(require.resolve("next/package.json"))), join(fixture, "node_modules"), "dir");
  const env = {PATH: process.env.PATH || "", NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1"};
  for (const key of ["WHATSAPP_ADMIN_DRY_RUN_ENABLED", "NEXT_PUBLIC_C2_EMULATOR_MODE", "GCLOUD_PROJECT", "GOOGLE_CLOUD_PROJECT", "FIREBASE_AUTH_EMULATOR_HOST", "FIRESTORE_EMULATOR_HOST"]) env[key] = process.env[key];
  Object.assign(env, extraEnv);
  const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", fixture, "--webpack", "--hostname", "127.0.0.1", "--port", String(port)], {cwd: fixture, env, stdio: "ignore", detached: true});
  child.on("error", () => {}); children.push(child); return child;
}
async function http(child, port, path, {method = "GET", token, data, raw, signature} = {}) {
  alive(child);
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {method, redirect: "error", signal: AbortSignal.timeout(10000),
    headers: {...(token ? {Authorization: "Bearer " + token} : {}), ...(data || raw ? {"Content-Type": "application/json"} : {}), ...(signature ? {"x-hub-signature-256": signature} : {})},
    ...(data ? {body: JSON.stringify(data)} : raw ? {body: raw} : {})});
  const text = await response.text(); if (text.length > 32768) throw Error("HTTP_RESPONSE_LIMIT"); alive(child);
  return {status: response.status, text, json: () => JSON.parse(text)};
}
function identity(...parts) {return createHmac("sha256", fake.WHATSAPP_SESSION_HASH_SECRET).update(JSON.stringify(parts)).digest("hex");}
function message(text, user = "a") {
  const id = `wamid.integration.${runId}.${++sequence}`, from = "TEST." + runId + "." + user;
  const payload = {object: "whatsapp_business_account", entry: [{id: fake.WHATSAPP_TEST_WABA_ID, changes: [{field: "messages", value: {
    messaging_product: "whatsapp", metadata: {phone_number_id: fake.WHATSAPP_TEST_PHONE_NUMBER_ID}, messages: [{id, from_user_id: from, type: "text", timestamp: String(Math.floor(Date.now() / 1000) + sequence), text: {body: text}}]
  }}]}]};
  return {payload, key: identity("message", fake.WHATSAPP_TEST_WABA_ID, fake.WHATSAPP_TEST_PHONE_NUMBER_ID, id),
    sessionKey: identity("session", fake.WHATSAPP_TEST_WABA_ID, fake.WHATSAPP_TEST_PHONE_NUMBER_ID, "bsuid:" + from)};
}
try {
  const admin = await actor("admin"), user = await actor("user");
  for (let n = 0; n < 3; n++) {
    const ref = db.collection("products").doc("wa-integration-" + runId + "-" + n);
    await ref.create({name: "Fictional Isuzu", brand: "Isuzu", model, type: "sale", city: "Kinshasa", price: 10000 + n * 100, currency: "USD", status: "active", expiresAt: new Date(Date.now() + 3600000 + n * 1000), phoneNumber: "PRIVATE_SENTINEL", email: "PRIVATE_SENTINEL", user: "PRIVATE_SENTINEL"}); refs.set(ref.path, ref);
  }
  const market = await start("marketplace", MARKETPLACE_PORT, fake), staffServer = await start("admin", ADMIN_PORT, {});
  const challenge = "integration-" + runId, query = new URLSearchParams({"hub.mode": "subscribe", "hub.challenge": challenge, "hub.verify_token": fake.WHATSAPP_VERIFY_TOKEN});
  const deadline = Date.now() + 90000; let ready = false;
  while (Date.now() < deadline) {alive(market); alive(staffServer); try {
    const [a, m] = await Promise.all([http(staffServer, ADMIN_PORT, "/api/admin/whatsapp-requests"), http(market, MARKETPLACE_PORT, "/api/whatsapp/webhook?" + query)]);
    ready = a.status === 401 && m.status === 200 && m.text === challenge;
  } catch {alive(market); alive(staffServer);} if (ready) break; await delay(100);}
  expect(ready, "both exact source routes ready over HTTP"); console.log("PASS both pinned-source Next fixtures ready, shared demo project only");
  async function post(item, valid = true) {
    await reserve("waDryRunMessages", item.key); await reserve("waDryRunSessions", item.sessionKey);
    const raw = JSON.stringify(item.payload), signature = "sha256=" + (valid ? createHmac("sha256", fake.WHATSAPP_APP_SECRET).update(raw).digest("hex") : "0".repeat(64));
    return http(market, MARKETPLACE_PORT, "/api/whatsapp/webhook", {method: "POST", raw, signature});
  }
  const invalid = message("humain", "invalid");
  expect((await post(invalid, false)).status === 401, "invalid signature rejected");
  expect(!(await db.collection("waDryRunMessages").doc(invalid.key).get()).exists, "invalid signature creates no receipt");
  const invalidTask = await reserve("waDryRunAdvisorRequests", invalid.key);
  expect((await http(staffServer, ADMIN_PORT, "/api/admin/whatsapp-requests", {method: "POST", token: admin.token, data: {receiptKey: invalid.key}})).status === 404, "invalid signature cannot become Admin task");
  expect(!(await invalidTask.get()).exists, "invalid signature creates no task");
  const qualify = message("acheter Isuzu Kinshasa modèle: " + model + ";"); expect((await post(qualify)).status === 200, "qualification accepted");
  const catalogMessage = message("budget 15000 USD"); const ack = await post(catalogMessage);
  expect(ack.status === 200 && JSON.stringify(ack.json()) === JSON.stringify({ok: true, dryRun: true}), "catalog HTTP exposes ACK only");
  const catalog = (await db.collection("waDryRunMessages").doc(catalogMessage.key).get()).data().draft;
  expect(catalog.kind === "catalog" && catalog.offers.length === 3, "actual canonical catalog produced");
  const choice = message("annonce 2"); expect((await post(choice)).status === 200, "selection accepted");
  const selected = (await db.collection("waDryRunMessages").doc(choice.key).get()).data().draft;
  expect(selected.kind === "selection" && selected.offer.id === catalog.offers[1].id, "selection maps to prior group");
  await db.collection("products").doc(selected.offer.id).update({price: 11200});
  const human = message("parler à un conseiller"); expect((await post(human)).status === 200, "human intent generated by signed HTTP");
  const receiptRef = db.collection("waDryRunMessages").doc(human.key), receipt = await receiptRef.get(), context = receipt.data().draft.context;
  expect(context.scope === "selected" && context.offer.id === selected.offer.id && context.offer.price === 11200, "human context uses current canonical price");
  expect(!JSON.stringify(context).includes("PRIVATE_SENTINEL") && !Object.hasOwn(context.criteria, "model"), "human context excludes private/free model fields");
  const outsider = message("humain " + selected.offer.id, "b"); await post(outsider);
  const otherContext = (await db.collection("waDryRunMessages").doc(outsider.key).get()).data().draft.context;
  expect(otherContext.scope === "general" && otherContext.offer === null, "second account cannot claim first selection by raw ID");
  const target = await reserve("waDryRunAdvisorRequests", human.key);
  expect((await http(staffServer, ADMIN_PORT, "/api/admin/whatsapp-requests", {method: "POST", token: user.token, data: {receiptKey: human.key}})).status === 403, "nonstaff cannot import");
  expect(!(await target.get()).exists, "nonstaff creates no task");
  const imported = await http(staffServer, ADMIN_PORT, "/api/admin/whatsapp-requests", {method: "POST", token: admin.token, data: {receiptKey: human.key}});
  expect(imported.status === 200 && imported.json().created === true, "Admin imports real produced receipt by key only");
  expect(JSON.stringify(imported.json().item.context) === JSON.stringify(context), "Admin snapshot exactly matches producer DTO");
  const taskSnapshot = await target.get(); await post(human);
  expect((await receiptRef.get()).updateTime.isEqual(receipt.updateTime), "Marketplace replay does not rewrite receipt");
  const replay = await http(staffServer, ADMIN_PORT, "/api/admin/whatsapp-requests", {method: "POST", token: admin.token, data: {receiptKey: human.key}});
  expect(replay.status === 200 && replay.json().created === false && (await target.get()).updateTime.isEqual(taskSnapshot.updateTime), "reimport after replay does not duplicate or audit");
  const listed = await http(staffServer, ADMIN_PORT, "/api/admin/whatsapp-requests?limit=20", {token: admin.token});
  expect(listed.status === 200 && listed.json().items.some(item => item.id === human.key && item.context.offer.price === 11200), "staff list contains same produced task");
  const claim = await http(staffServer, ADMIN_PORT, "/api/admin/whatsapp-requests/" + human.key, {method: "PATCH", token: admin.token, data: {action: "claim", expectedVersion: 0}});
  expect(claim.status === 200 && claim.json().item.assignedTo === admin.uid, "staff claims own test task");
  const close = await http(staffServer, ADMIN_PORT, "/api/admin/whatsapp-requests/" + human.key, {method: "PATCH", token: admin.token, data: {action: "close", expectedVersion: 1}});
  expect(close.status === 200 && close.json().item.state === "closed", "staff closes same test task");
  const closed = await target.get();
  const closeReplay = await http(staffServer, ADMIN_PORT, "/api/admin/whatsapp-requests/" + human.key, {method: "PATCH", token: admin.token, data: {action: "close", expectedVersion: 1}});
  expect(closeReplay.status === 200 && closeReplay.json().changed === false && (await target.get()).updateTime.isEqual(closed.updateTime), "close replay has no extra audit");
  expect(closed.data().fixtureOnly === true && closed.data().dryRun === true, "task remains explicitly fictitious");
  console.log(`PASS ${checks} integration HTTP checks — Marketplace qualification/catalog/selection/human → Admin import/list/claim/close`);
} catch {
  console.error(`INTEGRATION_HTTP_FAILED after ${checks} safe assertions — no raw errors, bodies or tokens logged`); process.exitCode = 1;
} finally {await cleanup();}
