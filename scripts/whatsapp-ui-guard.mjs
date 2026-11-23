import {isAbsolute} from "node:path";
export const UI_PORT = 3230;
export function assertWhatsAppUiEnvironment(env) {
  const exact = {CI: "true", GITHUB_ACTIONS: "true", WHATSAPP_UI_TEST_CONFIRMED: "yes", WHATSAPP_ADMIN_DRY_RUN_ENABLED: "true", NEXT_PUBLIC_C2_EMULATOR_MODE: "true", GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080"};
  if (!["test", "development"].includes(env.NODE_ENV) || Object.entries(exact).some(([key, value]) => env[key] !== value) ||
      !isAbsolute(env.PLAYWRIGHT_RUNTIME_DIR || "") || !/^[a-f0-9]{40}$/.test(env.WHATSAPP_UI_SOURCE_SHA || "") ||
      ["GOOGLE_APPLICATION_CREDENTIALS", "FIREBASE_SERVICE_ACCOUNT_JSON", "FIREBASE_SERVICE_ACCOUNT_KEY", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_SESSION_HASH_SECRET", "WHATSAPP_ACCESS_TOKEN", "META_ACCESS_TOKEN", "META_APP_SECRET"].some(key => Boolean(env[key]))) throw Error("WHATSAPP_UI_ISOLATION_REQUIRED");
}
export function browserRequestAllowed(raw) {
  try {const url = new URL(raw); return ["http:", "https:"].includes(url.protocol) && ["127.0.0.1", "localhost"].includes(url.hostname) && [String(UI_PORT), "9099", "8080"].includes(url.port);}
  catch {return false;}
}
export function expectedFontRequest(raw) {
  try {const url = new URL(raw); return url.protocol === "https:" && ["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname);}
  catch {return false;}
}
