#!/usr/bin/env node
// Read-only authorization smoke tests against an isolated Motuka Admin preproduction deployment.
// Usage:
// ADMIN_BASE_URL=https://preprod.example.com ADMIN_ID_TOKEN=... MANAGER_ID_TOKEN=... USER_ID_TOKEN=... node scripts/test-admin-access.mjs
// Do not use production tokens or production endpoints.
const base = process.env.ADMIN_BASE_URL;
const tokens = {
  admin: process.env.ADMIN_ID_TOKEN,
  manager: process.env.MANAGER_ID_TOKEN,
  user: process.env.USER_ID_TOKEN,
};
if (!base || !/^https:\/\//.test(base) || !Object.values(tokens).every(Boolean)) {
  console.error("Required: HTTPS ADMIN_BASE_URL and ADMIN_ID_TOKEN, MANAGER_ID_TOKEN, USER_ID_TOKEN");
  process.exit(2);
}
const url = new URL(base);
if (url.username || url.password || url.pathname !== "/" || url.search || url.hash || ["motukadmin.vercel.app", "motuka.cd", "www.motuka.cd"].includes(url.hostname) || url.hostname.endsWith(".motuka.cd")) {
  console.error("Production targets are forbidden by this test script.");
  process.exit(2);
}
const cases = [
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
