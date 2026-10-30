import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, requireStaff, fail, HttpError, requireString } from "@/lib/server/admin";

export async function GET(request) {
  try {
    const actor = await requireStaff(request);
    const snap = await adminDb().collection("users").where("isPartner", "==", true).limit(500).get();
    const partners = snap.docs.map(doc => {
      const user = doc.data();
      return {
        id: doc.id,
        uid: doc.id,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        city: user.city || "",
        status: ["blocked", "disabled"].includes(user.status) ? "blocked" : "active",
        partnerType: "commissionnaire",
        ...(actor.role === "admin" ? { phoneNumber: user.phoneNumber || "" } : {}),
      };
    });
    return Response.json({ partners });
  } catch (error) { return fail(error); }
}

export async function POST(request) {
  try {
    const actor = await requireStaff(request, ["admin"]);
    const { uid, reason } = await request.json();
    const auditReason = requireString(reason, "Justification", 1000);
    const id = requireString(uid, "UID", 128);
    if (id.includes("/")) throw new HttpError(400, "UID invalide");
    let account;
    try { account = await adminAuth().getUser(id); }
    catch (error) { if (error.code === "auth/user-not-found") throw new HttpError(404, "Compte Firebase Authentication introuvable"); throw error; }
    if (account.disabled) throw new HttpError(409, "Compte Firebase Authentication désactivé");
    const db = adminDb();
    await db.runTransaction(async tx => {
      const ref = db.collection("users").doc(id);
      const user = await tx.get(ref);
      if (!user.exists) throw new HttpError(404, "Utilisateur introuvable");
      if (["blocked", "disabled"].includes(user.data().status)) throw new HttpError(409, "Compte utilisateur désactivé");
      if (user.data().isPartner === true) throw new HttpError(409, "Utilisateur déjà commissionnaire");
      const application = await tx.get(db.collection("partnerApplications").doc(id));
      if (application.exists && application.data().status === "pending") throw new HttpError(409, "Candidature en attente : utilisez le parcours de décision");
      const now = FieldValue.serverTimestamp();
      tx.update(ref, { isPartner: true, partnerUpdatedAt: now });
      tx.create(db.collection("partnerAuditEvents").doc(), { uid: id, action: "direct_grant", actorUid: actor.uid, actorRole: actor.role, reason: auditReason, previousIsPartner: false, nextIsPartner: true, createdAt: now });
    });
    return Response.json({ ok: true, uid: id, isPartner: true });
  } catch (error) { return fail(error); }
}

export async function PATCH(request) {
  try {
    const actor = await requireStaff(request, ["admin"]);
    const { uid, isPartner, reason } = await request.json();
    const auditReason = requireString(reason, "Justification", 1000);
    const id = requireString(uid, "UID", 128);
    if (id.includes("/") || typeof isPartner !== "boolean") throw new HttpError(400, "Données invalides");
    if (isPartner) {
      let account;
      try { account = await adminAuth().getUser(id); }
      catch (error) { if (error.code === "auth/user-not-found") throw new HttpError(404, "Compte Firebase Authentication introuvable"); throw error; }
      if (account.disabled) throw new HttpError(409, "Compte Firebase Authentication désactivé");
    }
    const db = adminDb();
    await db.runTransaction(async tx => {
      const ref = db.collection("users").doc(id);
      const user = await tx.get(ref);
      if (!user.exists) throw new HttpError(404, "Utilisateur introuvable");
      if (isPartner && ["blocked", "disabled"].includes(user.data().status)) throw new HttpError(409, "Compte utilisateur désactivé");
      if (user.data().isPartner === isPartner) throw new HttpError(409, "Statut commissionnaire déjà défini");
      const application = await tx.get(db.collection("partnerApplications").doc(id));
      if (isPartner && application.exists && application.data().status === "pending") throw new HttpError(409, "Candidature en attente : utilisez le parcours de décision");
      const now = FieldValue.serverTimestamp();
      tx.update(ref, { isPartner, partnerUpdatedAt: now });
      tx.create(db.collection("partnerAuditEvents").doc(), { uid: id, action: isPartner ? "direct_grant" : "revoke", actorUid: actor.uid, actorRole: actor.role, reason: auditReason, previousIsPartner: !isPartner, nextIsPartner: isPartner, createdAt: now });
    });
    return Response.json({ ok: true, uid: id, isPartner });
  } catch (error) { return fail(error); }
}
