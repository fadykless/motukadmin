import {readFile, realpath, lstat} from "node:fs/promises";
import {createHash} from "node:crypto";
import {isAbsolute, join, sep} from "node:path";
import {assertPortFree, ADMIN_PORT, MARKETPLACE_PORT} from "./whatsapp-integration-guard.mjs";
export {assertPortFree, ADMIN_PORT, MARKETPLACE_PORT};
const pinned = {
  marketplace: {repo: "fadykless/motuka", sha: "9dcd249187ca0209e5da6e3576a0a2be7f12c3ac", files: 210, total: 212},
  admin: {repo: "fadykless/motukadmin", sha: "3ffea5e879621991e790b3f123a49a0756d01bd1", files: 139, total: 139}
};
const modules = ["next", "react", "react-dom", "firebase", "firebase-admin", "@mui/material"];
export function assertFullAppEnvironment(env) {
  const exact = {WHATSAPP_FULL_APP_TEST_CONFIRMED: "yes", WHATSAPP_ADMIN_DRY_RUN_ENABLED: "true", NEXT_PUBLIC_C2_EMULATOR_MODE: "true", GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080"};
  if (!["test", "development"].includes(env.NODE_ENV) || Object.entries(exact).some(([key, value]) => env[key] !== value) ||
      !isAbsolute(env.ADMIN_SOURCE_DIR || "") || !isAbsolute(env.MARKETPLACE_SOURCE_DIR || "") ||
      ["ADMIN_DEPENDENCIES_DIR", "MARKETPLACE_DEPENDENCIES_DIR"].some(key => env[key] && !isAbsolute(env[key])) ||
      ["GOOGLE_APPLICATION_CREDENTIALS", "FIREBASE_SERVICE_ACCOUNT_JSON", "FIREBASE_SERVICE_ACCOUNT_KEY", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_SESSION_HASH_SECRET", "WHATSAPP_ACCESS_TOKEN", "META_ACCESS_TOKEN", "META_APP_SECRET"].some(key => Boolean(env[key]))) throw Error("FULL_APP_ISOLATION_REQUIRED");
}
function safePath(path) {
  const parts = path.split("/");
  return path && !isAbsolute(path) && !path.includes("\\") && !path.includes("\0") &&
    parts.every(part => part && ![".", "..", ".git", ".next", "node_modules"].includes(part) && !part.startsWith(".env")) &&
    !/\.(log|pem|key|p12|pfx)$/i.test(path);
}
export async function verifyFullSource(name, directory, manifest) {
  const expected = pinned[name], spec = manifest[name];
  if (manifest.schema !== "motuka.whatsapp.full-app-sources.v1" || !expected || spec?.repo !== expected.repo || spec.sha !== expected.sha ||
      spec.trackedBlobs !== expected.total || Object.keys(spec.files || {}).length !== expected.files ||
      !Array.isArray(spec.omitted) || (name === "admin" ? spec.omitted.length !== 0 : spec.omitted.length !== 2 ||
        spec.omitted.map(value => value.path).sort().join("|") !== "public/mobilePub-ancien.mp4|public/mobilePub.mp4")) throw Error("FULL_APP_MANIFEST_MISMATCH");
  const root = await realpath(directory), files = {};
  for (const [path, metadata] of Object.entries(spec.files)) {
    if (!safePath(path) || !/^[a-f0-9]{64}$/.test(metadata.sha256) || !/^[a-f0-9]{40}$/.test(metadata.gitBlobSha) ||
        !Number.isSafeInteger(metadata.bytes) || metadata.bytes < 0 || metadata.bytes > 20000000 || !["100644", "100755"].includes(metadata.mode)) throw Error("FULL_APP_MANIFEST_MISMATCH");
    const file = join(root, path), canonical = await realpath(file);
    if (!canonical.startsWith(root + sep) || !(await lstat(file)).isFile()) throw Error("FULL_APP_SOURCE_ESCAPE");
    const bytes = await readFile(file);
    const gitBlob = createHash("sha1").update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest("hex");
    if (bytes.length !== metadata.bytes || createHash("sha256").update(bytes).digest("hex") !== metadata.sha256 || gitBlob !== metadata.gitBlobSha) throw Error("FULL_APP_SOURCE_MISMATCH");
    files[path] = {bytes, mode: metadata.mode === "100755" ? 0o755 : 0o644};
  }
  return {files, root, spec};
}
export async function verifyDependencies(directory, source) {
  const root = await realpath(directory), lock = JSON.parse(source.files["package-lock.json"].bytes), versions = {};
  for (const name of modules) {
    const actual = JSON.parse(await readFile(join(root, name, "package.json"), "utf8")).version;
    if (!actual || actual !== lock.packages?.["node_modules/" + name]?.version) throw Error("FULL_APP_DEPENDENCY_MISMATCH");
    versions[name] = actual;
  }
  const nextCli = join(root, "next/dist/bin/next");
  if (!(await lstat(nextCli)).isFile()) throw Error("FULL_APP_DEPENDENCY_MISMATCH");
  return {root, versions, nextCli};
}
