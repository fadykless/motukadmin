import { adminAuth, adminDb, requireStaff, fail, HttpError, requireString } from "@/lib/server/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request, context) {
  try {
    const actor = await requireStaff(request, ["admin"]);
    const { uid } = await context.params;
    if (typeof uid !== "string" || !uid.trim() || uid.length > 128 || uid.includes("/")) throw new HttpError(400, "UID invalide");
    const body = await request.json();
    const { action, expectedVersion } = body;
    if (!["approve", "reject"].includes(action) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw new HttpError(400, "Décision invalide");
    const reason = action === "reject" ? requireString(body.reason, "Motif", 1000) : null;
    const account = await adminAuth().getUser(uid).catch(error => {
      if (error.code === "auth/user-not-found") throw new HttpError(409, "Compte introuvable");
      throw error;
    });
    if (account.disabled) throw new HttpError(409, "Compte désactivé");
    const db = adminDb();
    const appRef = db.collection("partnerApplications").doc(uid);
    const userRef = db.collection("users").doc(uid);
    const eventRef = appRef.collection("history").doc();
    await db.runTransaction(async tx => {
      const [app, user] = await Promise.all([tx.get(appRef), tx.get(userRef)]);
      if (!app.exists) throw new HttpError(404, "Candidature introuvable");
      if (!user.exists) throw new HttpError(409, "Profil introuvable");
      const a = app.data();
      const u = user.data();
      const version = Number.isSafeInteger(a.decisionVersion) ? a.decisionVersion : 0;
      if (a.status !== "pending" || version !== expectedVersion) throw new HttpError(409, "Dossier modifié, rechargez-le");
      if (["blocked", "disabled"].includes(u.status) || u.isPartner === true) throw new HttpError(409, "Compte inéligible");
      const now = FieldValue.serverTimestamp();
      const status = action === "approve" ? "approved" : "rejected";
      tx.update(appRef, { status, decisionVersion: version + 1, updatedAt: now, reviewedAt: now, reviewedBy: actor.uid, rejectionReason: reason });
      if (action === "approve") tx.update(userRef, { isPartner: true, partnerUpdatedAt: now });
      tx.create(eventRef, { uid, action, actorUid: actor.uid, actorRole: actor.role, reason, previousStatus: a.status, nextStatus: status, previousIsPartner: u.isPartner === true, nextIsPartner: action === "approve", decisionVersion: version + 1, createdAt: now });
    });
    return Response.json({ ok: true, uid, status: action === "approve" ? "approved" : "rejected" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
