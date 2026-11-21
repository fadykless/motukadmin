import {readFile, access} from "node:fs/promises";
import {createHash} from "node:crypto";
export const RULES_PROJECT = "demo-motuka-whatsapp-rules", RULES_HOST = "127.0.0.1:8190";
export function assertRulesEnvironment(env) {
  if (env.WHATSAPP_RULES_TEST_CONFIRMED !== "yes" || env.GCLOUD_PROJECT !== RULES_PROJECT ||
      (env.GOOGLE_CLOUD_PROJECT && env.GOOGLE_CLOUD_PROJECT !== RULES_PROJECT) ||
      env.FIRESTORE_EMULATOR_HOST !== RULES_HOST || !["test", "development"].includes(env.NODE_ENV) ||
      ["GOOGLE_APPLICATION_CREDENTIALS", "FIREBASE_SERVICE_ACCOUNT_JSON", "FIREBASE_SERVICE_ACCOUNT_KEY", "WHATSAPP_ACCESS_TOKEN", "META_ACCESS_TOKEN"].some(key => Boolean(env[key]))) throw Error("RULES_TEST_ISOLATION_REQUIRED");
}
export async function verifiedRulesFixture(base = new URL("../tests/fixtures/whatsapp-rules/", import.meta.url)) {
  const [rules, configBytes, manifestBytes] = await Promise.all(["marketplace.firestore.rules", "marketplace.firebase.json", "manifest.json"].map(path => readFile(new URL(path, base))));
  const manifest = JSON.parse(manifestBytes), config = JSON.parse(configBytes), source = manifest.marketplace;
  const digest = bytes => createHash("sha256").update(bytes).digest("hex");
  if (manifest.schema !== "motuka.whatsapp.rules-proof.v1" || source?.repository !== "fadykless/motuka" || source.commit !== "9dcd249187ca0209e5da6e3576a0a2be7f12c3ac" ||
      source.sourceRules !== "firestore.rules" || source.sourceConfig !== "firebase.json" || config.firestore?.rules !== source.sourceRules ||
      digest(rules) !== source.rulesSha256 || digest(configBytes) !== source.configSha256 ||
      manifest.admin?.commit !== "682637a91b4c1d6e27cdd490d138d0e8d171be47" || manifest.admin.deploymentRulesFound !== false || manifest.admin.deploymentConfigFound !== false) throw Error("RULES_FIXTURE_MISMATCH");
  return {rules: rules.toString("utf8"), manifest};
}
export async function assertAdminStillHasNoRules(root = new URL("../", import.meta.url)) {
  for (const path of ["firestore.rules", "firebase.json"]) {
    try {await access(new URL(path, root));} catch (error) {if (error.code === "ENOENT") continue; throw error;}
    throw Error("ADMIN_RULES_AUDIT_REQUIRED");
  }
}
