/* global document */
import assert from "node:assert/strict";
import {randomUUID, createHash} from "node:crypto";
import {mkdir, readdir, readFile, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {createRequire} from "node:module";
import {spawn, execFileSync} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {setTimeout, clearTimeout} from "node:timers";
import net from "node:net";
import {assertWhatsAppUiEnvironment, browserRequestAllowed, expectedFontRequest, UI_PORT} from "./whatsapp-ui-guard.mjs";
try {assertWhatsAppUiEnvironment(process.env);} catch {console.error("WHATSAPP_UI_ISOLATION_REQUIRED"); process.exit(2);}
const root = fileURLToPath(new URL("../", import.meta.url)), require = createRequire(import.meta.url), origin = `http://127.0.0.1:${UI_PORT}`;
if ((await readdir(root)).some(name => name.startsWith(".env"))) throw Error("ENV_FILE_FORBIDDEN");
if (execFileSync("git", ["rev-parse", "HEAD"], {cwd: root, encoding: "utf8"}).trim() !== process.env.WHATSAPP_UI_SOURCE_SHA) throw Error("SOURCE_SHA_MISMATCH");
const runtime = process.env.PLAYWRIGHT_RUNTIME_DIR;
if (JSON.parse(await readFile(join(runtime, "playwright/package.json"), "utf8")).version !== "1.56.1") throw Error("PLAYWRIGHT_VERSION_MISMATCH");
async function portFree() {
  const server = net.createServer();
  try {await new Promise((resolve, reject) => {server.once("error", reject); server.listen(UI_PORT, "127.0.0.1", resolve);});}
  finally {if (server.listening) await new Promise(resolve => server.close(resolve));}
}
await portFree();
// The actual Firebase SDK is loaded only after CI/demo/source/runtime checks.
const {initializeApp, deleteApp} = await import("firebase-admin/app"), {getFirestore} = await import("firebase-admin/firestore"), {getAuth} = await import("firebase-admin/auth");
const app = initializeApp({projectId: "demo-motuka-c2"}, "whatsapp-ui-" + randomUUID()), db = getFirestore(app), auth = getAuth(app);
db.settings({host: "127.0.0.1:8080", ssl: false});
const runId = randomUUID(), actors = [], owned = new Map(), folder = join(root, "artifacts/whatsapp-ui");
const summary = {schema: "motuka.whatsapp.ui-proof.v1", sourceSha: process.env.WHATSAPP_UI_SOURCE_SHA, fixtureOnly: true, cases: [], forbiddenBrowserRequests: 0, blockedFontRequests: 0, captures: [], cleanup: "not_started"};
let child, browser, cleanupPromise;
const hash = value => createHash("sha256").update(runId + value).digest("hex");
function alive() {if (!child || child.exitCode !== null || child.signalCode !== null) throw Error("OWNED_SERVER_EXITED"); process.kill(child.pid, 0);}
async function cleanup() {
  return cleanupPromise ??= (async () => {
    try {if (browser) await browser.close();}
    finally {
      if (child?.pid) {
        try {process.kill(-child.pid, "SIGTERM");} catch (error) {if (error.code !== "ESRCH") throw error;}
        for (let n = 0; n < 100 && child.exitCode === null && child.signalCode === null; n++) await delay(50);
        try {process.kill(-child.pid, "SIGKILL");} catch (error) {if (error.code !== "ESRCH") throw error;}
      }
      await Promise.all([...owned.values()].map(ref => ref.delete()));
      await Promise.all(actors.map(actor => auth.deleteUser(actor.uid)));
      await deleteApp(app); await portFree(); summary.cleanup = "exact_owned_records_and_process_only";
    }
  })();
}
async function saveSummary() {await writeFile(join(folder, "summary.json"), JSON.stringify(summary, null, 2) + "\n");}
for (const [signal, code] of [["SIGINT", 130], ["SIGTERM", 143]]) process.once(signal, () => {summary.runnerFailure = "INTERRUPTED"; void cleanup().finally(async () => {await saveSummary().catch(() => {}); process.exit(code);});});
const deadline = setTimeout(() => {summary.timeout = true; void cleanup().finally(async () => {await saveSummary().catch(() => {}); process.exit(1);});}, 360000); deadline.unref();
async function createActor(role, label) {
  const uid = "wa-ui-" + runId + "-" + role, email = uid + "@example.test", password = "FictionalUiOnly-123456!";
  await auth.createUser({uid, email, password, displayName: label});
  const actor = {uid, email, password, role}; actors.push(actor);
  const ref = db.collection("users").doc(uid); await ref.create({role, status: "active", name: label, isPartner: false, isTestAccount: true}); owned.set(ref.path, ref);
  const response = await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email, password, returnSecureToken: true}), signal: AbortSignal.timeout(10000)});
  assert.equal(response.status, 200); actor.token = (await response.json()).idToken; return actor;
}
async function api(path, actor, method = "GET", data) {
  alive(); const response = await fetch(origin + "/api/admin/whatsapp-requests" + path, {method, redirect: "error", headers: {Authorization: "Bearer " + actor.token, ...(data ? {"Content-Type": "application/json"} : {})}, ...(data ? {body: JSON.stringify(data)} : {}), signal: AbortSignal.timeout(10000)});
  return {status: response.status, body: await response.json()};
}
async function seedReceipt(label, general = false) {
  const key = hash(label), ref = db.collection("waDryRunMessages").doc(key), task = db.collection("waDryRunAdvisorRequests").doc(key), now = Date.now();
  assert.equal((await task.get()).exists, false); owned.set(task.path, task);
  const criteria = {type: general ? "parts" : "sale", city: general ? "Goma" : "Kinshasa", brand: general ? "Isuzu" : "Toyota", budgetMax: general ? 500 : 15000, currency: "USD", rentType: null};
  const id = "wa-ui-car-" + runId;
  await ref.create({status: "prepared", dryRun: true, fingerprint: hash(label + "fp"), sessionKey: hash(label + "session"), receivedAt: now, expiresAt: new Date(now + 3600000), draft: {kind: "human_intent", offers: [], context: {schema: "motuka.whatsapp.human-intent.v1", dryRun: true, scope: general ? "general" : "selected", criteria, offer: general ? null : {id, type: "sale", price: 12000, currency: "USD", url: "https://motukapp.com/marketplace/" + id}}}});
  owned.set(ref.path, ref); return {key, refs: [ref, task]};
}
async function browserContext(width) {
  const context = await browser.newContext({viewport: {width, height: 900}, baseURL: origin});
  await context.route("**/*", route => {
    const url = route.request().url();
    if (browserRequestAllowed(url)) return route.continue();
    if (expectedFontRequest(url)) summary.blockedFontRequests++; else summary.forbiddenBrowserRequests++;
    return route.abort("blockedbyclient");
  });
  return context;
}
async function login(page, actor) {
  await page.goto("/auth", {waitUntil: "domcontentloaded", timeout: 60000});
  await page.getByRole("textbox", {name: "Email", exact: true}).fill(actor.email);
  await page.getByLabel("Mot de passe", {exact: true}).fill(actor.password);
  await page.getByRole("button", {name: "Connexion", exact: true}).click();
}
async function capture(page, filename) {
  if (!/^(desktop|mobile)-(empty|imported|owned|closed|error|other-owned|failure)\.png$|^nonstaff-(blocked|failure)\.png$/.test(filename)) throw Error("CAPTURE_PATH_FORBIDDEN");
  await page.screenshot({path: join(folder, filename), fullPage: true, timeout: 10000}); summary.captures.push(filename);
}
async function inspectLayout(page, card) {
  const dimensions = await page.evaluate(() => ({document: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth}));
  assert.ok(dimensions.document <= dimensions.viewport + 1, "DOCUMENT_HORIZONTAL_OVERFLOW");
  for (const locator of [page.getByRole("textbox", {name: "Clé du reçu de test"}), page.getByRole("button", {name: "Importer", exact: true})]) {
    assert.equal(await locator.isVisible(), true, "EXPECTED_CONTROL_HIDDEN"); const rect = await locator.boundingBox();
    assert.ok(rect && rect.x >= -1 && rect.x + rect.width <= dimensions.viewport + 1, "CONTROL_OUTSIDE_VIEWPORT");
  }
  if (card) {
    const size = await card.evaluate(element => ({scroll: element.scrollWidth, client: element.clientWidth}));
    assert.ok(size.scroll <= size.client + 1, "CARD_HORIZONTAL_OVERFLOW");
    const rect = await card.boundingBox(); assert.ok(rect && rect.x >= -1 && rect.x + rect.width <= dimensions.viewport + 1, "CARD_OUTSIDE_VIEWPORT");
  }
}
async function queueScenario(admin, manager, name, width) {
  const result = {name, width, state: "running", stage: "login"}, context = await browserContext(width), page = await context.newPage(), caseRefs = [];
  summary.cases.push(result);
  try {
    await login(page, admin); await page.waitForURL("**/dashboard", {timeout: 30000});
    result.stage = "menu";
    if (width < 1200) await page.getByRole("button").filter({has: page.locator('svg[data-testid="MenuRoundedIcon"]')}).click();
    const link = page.getByRole("link", {name: "Demandes WhatsApp (test)", exact: true});
    await link.scrollIntoViewIfNeeded(); await link.click(); await page.waitForURL("**/whatsapp-demandes", {timeout: 15000});
    await page.getByRole("heading", {name: "Demandes de conseiller — test", exact: true}).waitFor();
    await page.getByText("Aucune demande de test active dans cette fenêtre.", {exact: true}).waitFor();
    await inspectLayout(page); await capture(page, name + "-empty.png");
    result.stage = "invalid-key";
    const input = page.getByRole("textbox", {name: "Clé du reçu de test"}), button = page.getByRole("button", {name: "Importer", exact: true});
    await input.fill("invalid-key"); assert.equal(await button.isDisabled(), true, "INVALID_KEY_BUTTON_ENABLED");
    const receipt = await seedReceipt(name); caseRefs.push(...receipt.refs);
    result.stage = "import"; await input.fill(receipt.key);
    const imported = page.waitForResponse(response => response.url() === origin + "/api/admin/whatsapp-requests" && response.request().method() === "POST");
    await button.click(); assert.equal((await imported).status(), 200);
    const card = page.locator(".MuiPaper-root").filter({hasText: "Dossier " + receipt.key}).last();
    await card.getByText("Intention liée à une annonce", {exact: true}).waitFor();
    for (const text of ["Kinshasa", "Toyota", "15000", "12000", "Instantané historique"]) assert.ok((await card.textContent()).includes(text), "MISSING_CONTEXT_FIELD");
    const publicLink = card.getByRole("link", {name: "Voir l’annonce", exact: true});
    assert.equal(await publicLink.getAttribute("href"), "https://motukapp.com/marketplace/wa-ui-car-" + runId); // Never navigate externally.
    await inspectLayout(page, card); await capture(page, name + "-imported.png");
    result.stage = "claim"; await card.getByRole("button", {name: "Prendre en charge ce test", exact: true}).click();
    await card.getByText("Pris en charge", {exact: true}).waitFor();
    await card.getByRole("button", {name: "Clôturer mon dossier de test", exact: true}).waitFor();
    await capture(page, name + "-owned.png");
    result.stage = "close"; await card.getByRole("button", {name: "Clôturer mon dossier de test", exact: true}).click();
    await card.getByText("Clôturé", {exact: true}).waitFor();
    assert.equal(await card.getByRole("button", {name: "Clôturer mon dossier de test", exact: true}).count(), 0);
    assert.equal((await db.collection("waDryRunAdvisorRequests").doc(receipt.key).get()).data().assignedTo, admin.uid);
    await capture(page, name + "-closed.png");
    result.stage = "missing-key-error";
    const missing = hash(name + "missing");
    for (const collection of ["waDryRunMessages", "waDryRunAdvisorRequests"]) {
      const ref = db.collection(collection).doc(missing); assert.equal((await ref.get()).exists, false); owned.set(ref.path, ref); caseRefs.push(ref);
    }
    await input.fill(missing); const rejected = page.waitForResponse(response => response.url() === origin + "/api/admin/whatsapp-requests" && response.request().method() === "POST");
    await button.click(); assert.equal((await rejected).status(), 404);
    await page.getByText("SOURCE_NOT_FOUND", {exact: true}).waitFor();
    assert.equal(await card.getByText("Clôturé", {exact: true}).isVisible(), true, "REFRESH_ERASED_EXISTING_CARD");
    await capture(page, name + "-error.png");
    result.stage = "other-owner";
    const other = await seedReceipt(name + "other", true); caseRefs.push(...other.refs);
    assert.equal((await api("", manager, "POST", {receiptKey: other.key})).status, 200);
    assert.equal((await api("/" + other.key, manager, "PATCH", {action: "claim", expectedVersion: 0})).status, 200);
    await page.getByRole("button", {name: "Actualiser", exact: true}).click();
    const otherCard = page.locator(".MuiPaper-root").filter({hasText: "Dossier " + other.key}).last();
    await otherCard.getByText("Pris en charge", {exact: true}).waitFor();
    assert.equal(await otherCard.getByRole("button", {name: "Clôturer mon dossier de test", exact: true}).count(), 0, "OTHER_OWNER_CLOSE_VISIBLE");
    assert.equal((await api("/" + other.key, admin, "PATCH", {action: "close", expectedVersion: 1})).status, 409);
    await inspectLayout(page, otherCard); await capture(page, name + "-other-owned.png");
    result.state = "passed"; result.stage = "complete"; console.log(`PASS WhatsApp UI ${name} ${width}px — real login/menu/import/claim/close/errors/isolation`);
  } catch {
    result.state = "failed"; await capture(page, name + "-failure.png").catch(() => {}); console.error(`FAIL WhatsApp UI ${name} at safe stage ${result.stage}`);
  } finally {
    await context.close(); for (const ref of caseRefs) {await ref.delete(); owned.delete(ref.path);}
  }
}
try {
  await mkdir(folder, {recursive: true});
  const admin = await createActor("admin", "Admin test WhatsApp"), manager = await createActor("manager", "Autre agent de test"), user = await createActor("user", "Compte sans droit de test");
  const env = {PATH: process.env.PATH || "", NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1", NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS: "1", NODE_USE_SYSTEM_CA: "1"};
  for (const key of ["WHATSAPP_ADMIN_DRY_RUN_ENABLED", "NEXT_PUBLIC_C2_EMULATOR_MODE", "GCLOUD_PROJECT", "GOOGLE_CLOUD_PROJECT", "FIREBASE_AUTH_EMULATOR_HOST", "FIRESTORE_EMULATOR_HOST", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE", "SSL_CERT_DIR"]) if (process.env[key]) env[key] = process.env[key];
  child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", root, "--webpack", "--hostname", "127.0.0.1", "--port", String(UI_PORT)], {cwd: root, env, stdio: "ignore", detached: true}); child.on("error", () => {});
  let ready = false; const startDeadline = Date.now() + 60000;
  while (Date.now() < startDeadline) {alive(); try {ready = (await fetch(origin + "/api/admin/whatsapp-requests", {signal: AbortSignal.timeout(10000)})).status === 401;} catch {alive();} if (ready) break; await delay(100);}
  assert.equal(ready, true, "REAL_APP_NOT_READY");
  const {chromium} = await import(pathToFileURL(join(runtime, "playwright/index.mjs")).href); browser = await chromium.launch({headless: true});
  await queueScenario(admin, manager, "desktop", 1280); await queueScenario(admin, manager, "mobile", 375);
  const result = {name: "nonstaff", width: 375, state: "running", stage: "login"}; summary.cases.push(result);
  const context = await browserContext(375), page = await context.newPage();
  try {
    await login(page, user); await page.waitForURL("**/unauthorized", {timeout: 30000});
    await page.goto("/whatsapp-demandes", {waitUntil: "domcontentloaded"}); await page.waitForURL("**/unauthorized", {timeout: 15000});
    assert.equal(await page.getByRole("heading", {name: "Demandes de conseiller — test", exact: true}).count(), 0);
    assert.equal((await api("", user)).status, 403);
    await capture(page, "nonstaff-blocked.png"); result.state = "passed"; result.stage = "complete"; console.log("PASS WhatsApp UI nonstaff — real login refused by guard and server403");
  } catch {result.state = "failed"; await capture(page, "nonstaff-failure.png").catch(() => {}); console.error("FAIL WhatsApp UI nonstaff at safe authorization stage");}
  finally {await context.close();}
  if (summary.cases.some(result => result.state !== "passed") || summary.forbiddenBrowserRequests > 0) process.exitCode = 1;
} catch {summary.runnerFailure = "STARTUP_OR_BROWSER_FAILURE"; process.exitCode = 1; console.error("WHATSAPP_UI_RUNNER_FAILED — raw errors/tokens are not logged");}
finally {clearTimeout(deadline); await cleanup(); await saveSummary();}
