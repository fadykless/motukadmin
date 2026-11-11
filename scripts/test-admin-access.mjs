#!/usr/bin/env node
// Read-only authorization smoke tests against an isolated Motuka Admin preproduction deployment.
// Usage:
// ADMIN_BASE_URL=https://staging.example.com ADMIN_STAGING_HOST=staging.example.com ADMIN_STAGING_CONFIRMED=yes ADMIN_ID_TOKEN=... MANAGER_ID_TOKEN=... USER_ID_TOKEN=... node scripts/test-admin-access.mjs
// Do not use production tokens or production endpoints.
const base = process.env.ADMIN_BASE_URL;
const tokens = {
  admin: process.env.ADMIN_ID_TOKEN,
  manager: process.env.MANAGER_ID_TOKEN,
  user: process.env.USER_ID_TOKEN,
};
if (!base || !Object.values(tokens).every(Boolean)) {
  console.error("Required: ADMIN_BASE_URL and ADMIN_ID_TOKEN, MANAGER_ID_TOKEN, USER_ID_TOKEN");
  process.exit(2);
}
const url = new URL(base);
const localMode = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
const stagingMode = url.protocol === "https:"
  && !!process.env.ADMIN_STAGING_HOST
  && url.hostname === process.env.ADMIN_STAGING_HOST
  && process.env.ADMIN_STAGING_CONFIRMED === "yes";
const emulatorSafe = process.env.GCLOUD_PROJECT === "demo-motuka-c2"
  && process.env.GOOGLE_CLOUD_PROJECT === "demo-motuka-c2"
  && process.env.FIRESTORE_EMULATOR_HOST === "127.0.0.1:8080"
  && process.env.FIREBASE_AUTH_EMULATOR_HOST === "127.0.0.1:9099";
if ((!localMode && !stagingMode) || (localMode && !emulatorSafe)) {
  console.error("Only explicitly confirmed HTTPS staging or localhost with demo-motuka-c2 Auth/Firestore emulators is allowed.");
  process.exit(2);
}
if (url.username || url.password || url.pathname !== "/" || url.search || url.hash || ["motukadmin.vercel.app", "motuka.cd", "www.motuka.cd"].includes(url.hostname) || url.hostname.endsWith(".motuka.cd")) {
  console.error("Production targets are forbidden by this test script.");
  process.exit(2);
}
const cases = [
  // C2 commissionnaire routes: read-only requests or authorization-denied writes.
  { name: "C2 no token / applications", path: "/api/admin/partner-applications", token: null, expected: 401 },
  { name: "C2 invalid token / applications", path: "/api/admin/partner-applications", token: "invalid-token", expected: 401 },
  { name: "C2 user / applications", path: "/api/admin/partner-applications", token: tokens.user, expected: 403 },
  { name: "C2 manager / applications", path: "/api/admin/partner-applications?limit=1", token: tokens.manager, expected: 200, hideC2Phone: true },
  { name: "C2 admin / applications", path: "/api/admin/partner-applications?limit=1", token: tokens.admin, expected: 200 },
  { name: "C2 manager invalid limit", path: "/api/admin/partner-applications?limit=0", token: tokens.manager, expected: 400 },
  { name: "C2 manager invalid status", path: "/api/admin/partner-applications?status=invalid", token: tokens.manager, expected: 400 },
  { name: "C2 no token / detail", path: "/api/admin/partner-applications/smoke-test", token: null, expected: 401 },
  { name: "C2 user / detail", path: "/api/admin/partner-applications/smoke-test", token: tokens.user, expected: 403 },
  { name: "C2 manager / seeded detail", path: "/api/admin/partner-applications/c2-test-candidate", token: tokens.manager, expected: 200, hideC2Detail: true },
  { name: "C2 admin / seeded detail", path: "/api/admin/partner-applications/c2-test-candidate", token: tokens.admin, expected: 200, verifyC2AdminDetail: true },
  { name: "C2 manager / pending pagination", path: "/api/admin/partner-applications?status=pending&limit=1", token: tokens.manager, expected: 200, verifyC2Pagination: true },
  { name: "C2 no token / decision", path: "/api/admin/partner-applications/smoke-test/decision", method: "POST", token: null, body: { action: "approve", expectedVersion: 0 }, expected: 401 },
  { name: "C2 user / decision", path: "/api/admin/partner-applications/smoke-test/decision", method: "POST", token: tokens.user, body: { action: "approve", expectedVersion: 0 }, expected: 403 },
  { name: "C2 manager / decision", path: "/api/admin/partner-applications/smoke-test/decision", method: "POST", token: tokens.manager, body: { action: "approve", expectedVersion: 0 }, expected: 403 },
  { name: "No token / users", path: "/api/admin/users", token: null, expected: 401 },
  { name: "Invalid token / users", path: "/api/admin/users", token: "invalid-token", expected: 401 },
  { name: "User / users", path: "/api/admin/users", token: tokens.user, expected: 403 },
  { name: "Manager / users", path: "/api/admin/users", token: tokens.manager, expected: 200, hidePhone: true },
  { name: "Admin / users", path: "/api/admin/users", token: tokens.admin, expected: 200 },
  { name: "User / partners", path: "/api/admin/partners", token: tokens.user, expected: 403 },
  { name: "Manager / partners", path: "/api/admin/partners", token: tokens.manager, expected: 200, hidePhone: true },
  { name: "Admin / partners", path: "/api/admin/partners", token: tokens.admin, expected: 200 },
  { name: "User cannot update partner", path: "/api/admin/partners", method: "PATCH", token: tokens.user, body: { uid: "smoke-test", isPartner: true }, expected: 403 },
  { name: "Manager cannot update partner", path: "/api/admin/partners", method: "PATCH", token: tokens.manager, body: { uid: "smoke-test", isPartner: true }, expected: 403 },
  { name: "User cannot update user status", path: "/api/admin/users", method: "PATCH", token: tokens.user, body: { uid: "smoke-test", status: "blocked" }, expected: 403 },
  { name: "Manager cannot update user status", path: "/api/admin/users", method: "PATCH", token: tokens.manager, body: { uid: "smoke-test", status: "blocked" }, expected: 403 },
  { name: "User cannot update products", path: "/api/admin/products", method: "PATCH", token: tokens.user, body: { ids: ["smoke-test"], status: "hidden" }, expected: 403 },
  { name: "Manager cannot archive products", path: "/api/admin/products", method: "DELETE", token: tokens.manager, body: { ids: ["smoke-test"] }, expected: 403 },
];
// Fixtures are available only in the guarded local demo recipe.
if (localMode) {
  for (const role of ["admin", "manager"]) {
    for (const kind of ["legacy", "partial"]) cases.push({
      name: `C2 ${role} / ${kind} consent`, path: `/api/admin/partner-applications/c2-test-${kind}`,
      token: tokens[role], expected: 200, consentFixture: kind,
    });
  }
}
let failures = 0;
for (const test of cases) {
  try {
    const response = await fetch(new URL(test.path, url), {
      method: test.method || "GET",
      headers: { ...(test.token ? { Authorization: `Bearer ${test.token}` } : {}), ...(test.body ? { "Content-Type": "application/json" } : {}) },
      ...(test.body ? { body: JSON.stringify(test.body) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    let ok = response.status === test.expected;
    if (ok && test.hideC2Detail) {
      const payload = await response.json();
      ok = payload.canDecide === false
        && payload.application?.uid === "c2-test-candidate"
        && payload.application.termsVersion === "1.0"
        && payload.application.termsAcceptedAt === "2026-11-04T09:15:00.000Z"
        && payload.application.termsDocumentSha256 === "a".repeat(64)
        && payload.application.termsAcceptanceMethod === "authenticated_checkbox"
        && !Object.hasOwn(payload.application, "phone")
        && !Object.hasOwn(payload.application, "rejectionReason")
        && Array.isArray(payload.history)
        && payload.history.every(row => row.reason === null)
        && response.headers.get("cache-control")?.includes("no-store") === true;
    }
    if (ok && test.verifyC2AdminDetail) {
      const payload = await response.json();
      ok = payload.canDecide === true
        && payload.application?.uid === "c2-test-candidate"
        && payload.application.termsVersion === "1.0"
        && payload.application.termsAcceptedAt === "2026-11-04T09:15:00.000Z"
        && payload.application.termsDocumentSha256 === "a".repeat(64)
        && payload.application.termsAcceptanceMethod === "authenticated_checkbox"
        && Object.hasOwn(payload.application, "phone")
        && response.headers.get("cache-control")?.includes("no-store") === true;
    }
    if (ok && test.consentFixture) {
      const payload = await response.json();
      ok = payload.application.termsVersion === null
        && payload.application.termsAcceptedAt === null
        && payload.application.termsAcceptanceMethod === null
        && payload.application.termsDocumentSha256 === (test.consentFixture === "partial" ? "b".repeat(64) : null)
        && payload.application.motivation === "Historical motivation"
        && payload.application.experience === "Historical experience"
        && payload.partner.isPartner === false
        && payload.partner.profileExists === false;
    }
    if (ok && test.verifyC2Pagination) {
      const payload = await response.json();
      ok = Array.isArray(payload.applications)
        && payload.applications.length <= 1
        && payload.applications.every(row => row.status === "pending")
        && Object.hasOwn(payload, "nextCursor")
        && response.headers.get("cache-control")?.includes("no-store") === true;
    }
    if (ok && test.hideC2Phone) {
      const payload = await response.json();
      ok = Array.isArray(payload.applications)
        && payload.applications.every(row => !Object.hasOwn(row, "phone"))
        && response.headers.get("cache-control")?.includes("no-store") === true;
    }
    if (ok && test.hidePhone) {
      const payload = await response.json();
      const records = test.path.endsWith("partners") ? payload.partners : payload.users;
      ok = Array.isArray(records) && records.every(row => !Object.hasOwn(row, "phoneNumber"));
    }
    console.log(`${ok ? "PASS" : "FAIL"} ${test.name}: HTTP ${response.status} (expected ${test.expected})`);
    if (!ok) failures++;
  } catch (error) {
    console.error(`FAIL ${test.name}: ${error.message}`);
    failures++;
  }
}
console.log(`${cases.length - failures}/${cases.length} read-only authorization checks passed`);
process.exitCode = failures ? 1 : 0;
