#!/usr/bin/env node
// Read-only Lot 2 authorization checks on a separately isolated staging deployment.
// Never use production endpoints or production tokens.
const base = process.env.ADMIN_BASE_URL;
const host = process.env.ADMIN_STAGING_HOST;
const tokens = {
  admin: process.env.ADMIN_ID_TOKEN,
  manager: process.env.MANAGER_ID_TOKEN,
  user: process.env.USER_ID_TOKEN
};
if (!base || !host || process.env.ADMIN_STAGING_CONFIRMED !== "yes" ||
    !Object.values(tokens).every(Boolean)) {
  console.error("Staging URL, confirmed host, and three role tokens are required.");
  process.exit(2);
}
const target = new URL(base);
if (target.protocol !== "https:" || target.hostname !== host ||
    target.username || target.password || target.pathname !== "/" ||
    target.search || target.hash ||
    ["motukadmin.vercel.app", "motuka.cd", "www.motuka.cd"].includes(host) ||
    host.endsWith(".motuka.cd")) {
  console.error("Invalid or production staging target.");
  process.exit(2);
}
const cases = [
  ["No token / prospects", "/api/admin/contact-requests", null, 401],
  ["Invalid token / prospects", "/api/admin/contact-requests", "invalid-token", 401],
  ["User / prospects", "/api/admin/contact-requests", tokens.user, 403],
  ["Manager / prospects", "/api/admin/contact-requests", tokens.manager, 200],
  ["Admin / prospects", "/api/admin/contact-requests", tokens.admin, 200],
  ["User / staff", "/api/admin/contact-requests/staff", tokens.user, 403],
  ["Manager / staff", "/api/admin/contact-requests/staff", tokens.manager, 200],
  ["Admin / staff", "/api/admin/contact-requests/staff", tokens.admin, 200]
];
let failed = 0;
for (const [name, path, token, expected] of cases) {
  try {
    const response = await fetch(new URL(path, target), {
      headers: token ? { Authorization: "Bearer " + token } : {},
      redirect: "manual",
      signal: AbortSignal.timeout(15000)
    });
    const ok = response.status === expected;
    console.log((ok ? "PASS" : "FAIL") + " " + name + " expected=" + expected + " actual=" + response.status);
    if (!ok) failed++;
  } catch (error) {
    console.error("FAIL " + name + ": " + error.message);
    failed++;
  }
}
process.exitCode = failed ? 1 : 0;
