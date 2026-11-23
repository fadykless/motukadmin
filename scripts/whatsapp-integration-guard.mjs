import {readFile, realpath, lstat} from "node:fs/promises";
import {createHash} from "node:crypto";
import {isAbsolute, join, sep} from "node:path";
import net from "node:net";
export const ADMIN_PORT = 3220, MARKETPLACE_PORT = 3221;
export function assertIntegrationEnvironment(env) {
  const exact = {WHATSAPP_INTEGRATION_TEST_CONFIRMED: "yes", WHATSAPP_ADMIN_DRY_RUN_ENABLED: "true", NEXT_PUBLIC_C2_EMULATOR_MODE: "true", GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080"};
  if (!["test", "development"].includes(env.NODE_ENV) || Object.entries(exact).some(([key, value]) => env[key] !== value) ||
      !isAbsolute(env.MARKETPLACE_SOURCE_DIR || "") ||
      ["GOOGLE_APPLICATION_CREDENTIALS", "FIREBASE_SERVICE_ACCOUNT_JSON", "FIREBASE_SERVICE_ACCOUNT_KEY", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_SESSION_HASH_SECRET", "WHATSAPP_ACCESS_TOKEN", "META_ACCESS_TOKEN", "META_APP_SECRET"].some(key => Boolean(env[key]))) throw Error("INTEGRATION_ISOLATION_REQUIRED");
}
export async function assertPortFree(port) {
  const server = net.createServer();
  try {await new Promise((resolve, reject) => {server.once("error", reject); server.listen(port, "127.0.0.1", resolve);});}
  catch {throw Error("INTEGRATION_PORT_OCCUPIED");}
  finally {if (server.listening) await new Promise(resolve => server.close(resolve));}
}
export async function verifiedSources(directory, specification) {
  const root = await realpath(directory), contents = {};
  for (const [path, expected] of Object.entries(specification.files)) {
    if (!/^src\/[A-Za-z0-9_./[\]-]+\.(js|mjs)$/.test(path) || path.split("/").includes("..") || !/^[a-f0-9]{64}$/.test(expected)) throw Error("INVALID_SOURCE_MANIFEST");
    const file = join(root, path), canonical = await realpath(file);
    if (!canonical.startsWith(root + sep) || !(await lstat(file)).isFile()) throw Error("SOURCE_OUTSIDE_CHECKOUT");
    const bytes = await readFile(file);
    if (createHash("sha256").update(bytes).digest("hex") !== expected) throw Error("SOURCE_HASH_MISMATCH");
    contents[path] = bytes;
  }
  return contents;
}
