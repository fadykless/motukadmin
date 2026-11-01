import "server-only";
import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function app() {
  if (process.env.NEXT_PUBLIC_C2_EMULATOR_MODE === "true") {
    const expected = {
      GCLOUD_PROJECT: "demo-motuka-c2",
      GOOGLE_CLOUD_PROJECT: "demo-motuka-c2",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    };
    for (const [key, value] of Object.entries(expected)) {
      if (process.env[key] !== value) {
        throw new Error(`C2 emulator isolation failed: ${key}`);
      }
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error("C2 emulator isolation failed: service credentials are forbidden");
    }
    if (getApps().length) return getApps()[0];
    return initializeApp({ projectId: "demo-motuka-c2" });
  }
  if (getApps().length) return getApps()[0];
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return initializeApp({ credential: cert(JSON.parse(json)) });
  return initializeApp({ credential: applicationDefault() });
}
export const adminAuth = () => getAuth(app());
export const adminDb = () => getFirestore(app());

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export async function requireStaff(request, allowed = ["admin", "manager"]) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) throw new HttpError(401, "Authentification requise");
  let decoded;
  try { decoded = await adminAuth().verifyIdToken(header.slice(7), true); }
  catch { throw new HttpError(401, "Session invalide"); }
  // Check the current Auth account state in addition to the ID token and Firestore role.
  let account;
  try { account = await adminAuth().getUser(decoded.uid); }
  catch (error) {
    if (error.code === "auth/user-not-found") throw new HttpError(401, "Compte introuvable");
    throw error;
  }
  if (account.disabled) throw new HttpError(403, "Compte désactivé");
  const snap = await adminDb().collection("users").doc(decoded.uid).get();
  const user = snap.data();
  if (!user || user.status === "disabled" || user.status === "blocked" || !allowed.includes(user.role)) {
    throw new HttpError(403, "Accès refusé");
  }
  return { uid: decoded.uid, role: user.role };
}
export function fail(error) {
  if (!(error instanceof HttpError)) console.error("Admin API failure", error);
  return Response.json({ error: error instanceof HttpError ? error.message : "Erreur serveur" }, { status: error instanceof HttpError ? error.status : 500 });
}
export function requireString(value, label, max = 500) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new HttpError(400, label + " invalide");
  return value.trim();
}
