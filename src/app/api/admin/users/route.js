import { FieldValue } from "firebase-admin/firestore";
import { adminDb, requireStaff, fail, HttpError } from "@/lib/server/admin";
export async function GET(request) {
  try {
    const actor = await requireStaff(request);
    const snap = await adminDb().collection("users").limit(500).get();
    const users = snap.docs.map(doc => {
      const user = doc.data();
      return {
        id: doc.id,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        city: user.city || "",
        role: user.role || "user",
        status: user.status || "active",
        isPartner: user.isPartner === true,
        ...(actor.role === "admin" ? { phoneNumber: user.phoneNumber || "" } : {}),
      };
    });
    return Response.json({ users });
  } catch (error) { return fail(error); }
}
export async function PATCH(request) {
  try {
    const actor = await requireStaff(request, ["admin"]);
    const { uid, status } = await request.json();
    if (typeof uid !== "string" || !uid.trim() || uid.length > 128 || uid !== uid.trim() || uid.includes("/") || !["active", "blocked"].includes(status)) throw new HttpError(400, "Données invalides");
    if (uid === actor.uid) throw new HttpError(403, "Modification de votre propre statut interdite");
    const db = adminDb();
    await db.runTransaction(async tx => {
      const ref = db.collection("users").doc(uid);
      const user = await tx.get(ref);
      if (!user.exists) throw new HttpError(404, "Utilisateur introuvable");
      const wasPartner = user.data().isPartner === true;
      const now = FieldValue.serverTimestamp();
      tx.update(ref, status === "blocked" ? { status, isPartner: false, ...(wasPartner ? { partnerUpdatedAt: now } : {}) } : { status });
      if (status === "blocked" && wasPartner) {
        tx.create(db.collection("partnerAuditEvents").doc(), {
          uid, action: "account_block_revoke", actorUid: actor.uid, actorRole: actor.role,
          reason: "Blocage administratif du compte", previousIsPartner: true,
          nextIsPartner: false, createdAt: now,
        });
      }
    });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}
