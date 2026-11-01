import { adminAuth, adminDb, requireStaff, fail, HttpError } from "@/lib/server/admin";
import { FieldValue } from "firebase-admin/firestore";
import { validatePartnerDecision, evaluatePartnerDecision } from "@/lib/partnerDecisionPolicy.mjs";

export async function POST(request, context) {
  try {
    const actor = await requireStaff(request, ["admin"]);
    const { uid } = await context.params;
    if (typeof uid !== "string" || !uid.trim() || uid.length > 128 || uid.includes("/")) throw new HttpError(400, "UID invalide");
    const body = await request.json();
    const parsed = validatePartnerDecision(body);
    if (!parsed.ok) throw new HttpError(400, parsed.error);
    const { action, expectedVersion, reason } = parsed;
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
      const a = app.exists ? app.data() : null;
      const u = user.exists ? user.data() : null;
      const eligibility = evaluatePartnerDecision(a, u, expectedVersion, uid);
      if (!eligibility.ok) throw new HttpError(eligibility.status, eligibility.error);
      const version = eligibility.version;
      const now = FieldValue.serverTimestamp();
      const status = action === "approve" ? "approved" : "rejected";
      tx.update(appRef, { status, decisionVersion: version + 1, updatedAt: now, reviewedAt: now, reviewedBy: actor.uid, rejectionReason: reason });
      if (action === "approve") tx.update(userRef, { isPartner: true, partnerUpdatedAt: now });
      tx.create(eventRef, { uid, action, actorUid: actor.uid, actorRole: actor.role, reason, previousStatus: a.status, nextStatus: status, previousIsPartner: u.isPartner === true, nextIsPartner: action === "approve", decisionVersion: version + 1, createdAt: now });
    });
    return Response.json({ ok: true, uid, status: action === "approve" ? "approved" : "rejected" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return fail(error); }
}
