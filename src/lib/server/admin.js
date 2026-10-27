import "server-only";
import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function app() {
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
