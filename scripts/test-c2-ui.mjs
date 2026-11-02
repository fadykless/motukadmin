#!/usr/bin/env node
// Browser acceptance for C2: read-only UI interactions and cancel-only dialogs.
// Only local, isolated Auth and Firestore emulators with fictional actors.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const expected = {
  GCLOUD_PROJECT: "demo-motuka-c2",
  GOOGLE_CLOUD_PROJECT: "demo-motuka-c2",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  NEXT_PUBLIC_C2_EMULATOR_MODE: "true",
};
for (const [key, value] of Object.entries(expected)) {
  if (process.env[key] !== value) throw Error(`Unsafe browser test environment: ${key}`);
}
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS)
  throw Error("Service credentials forbidden");
const { chromium } = await import("playwright");
const origin = "http://127.0.0.1:3100";
await mkdir("artifacts/c2-ui", { recursive: true });
const browser = await chromium.launch({ headless: true });
async function scenario(role, width) {
  const context = await browser.newContext({ viewport: { width, height: 850 }, baseURL: origin });
  const page = await context.newPage();
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("textbox", { name: "Email" }).fill(`c2-test-${role}@example.test`);
    await page.getByLabel("Mot de passe").fill("LocalDemoOnly-123456");
    await page.getByRole("button", { name: "Connexion", exact: true }).click();
    await page.waitForURL("**/dashboard", { timeout: 20000 });
    await page.goto("/partenaires/candidatures", { waitUntil: "domcontentloaded" });
    await page.getByText("Candidatures commissionnaires").waitFor({ timeout: 20000 });
    await page.getByText("Candidate C2 (fictional)").first().waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: "Consulter" }).first().click();
    await page.getByText("Dossier : Candidate C2 (fictional)").waitFor({ timeout: 15000 });
    const approve = page.getByRole("button", { name: "Approuver", exact: true });
    if (role === "manager") {
      assert.equal(await approve.count(), 0, "Managers must not see admin-only decisions");
      assert.equal(await page.getByText("Téléphone :").count(), 0, "Manager must not see phone");
    } else {
      await approve.click();
      await page.getByText("Confirmer la décision").waitFor();
      await page.getByRole("button", { name: "Annuler" }).click();
      assert.equal(await page.getByText("Confirmer la décision").count(), 0, "Cancel closes dialog");
      assert.equal(await approve.isVisible(), true, "Cancel must preserve pending decision");
      assert.equal(await page.getByRole("button", { name: "Refuser avec motif" }).isDisabled(), true);
    }
    await page.screenshot({ path: `artifacts/c2-ui/${role}-${width}.png`, fullPage: true });
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    assert.ok(dimensions.documentWidth <= dimensions.viewportWidth + 1,
      `Horizontal overflow at ${role} ${width}: ${JSON.stringify(dimensions)}`);
    console.log(`PASS C2 browser ${role} ${width}px, auth, detail, controls, responsive`);
  } finally {
    await context.close();
  }
}
try {
  for (const role of ["manager", "admin"])
    for (const width of [375, 430, 1280]) await scenario(role, width);
  console.log("C2 UI browser tests PASS (fictional emulator accounts only)");
} finally {
  await browser.close();
}
