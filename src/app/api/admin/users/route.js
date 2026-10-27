import { adminDb, requireStaff, fail, HttpError } from "@/lib/server/admin";
export async function GET(request) {
  try {
    await requireStaff(request);
    const snap = await adminDb().collection("users").limit(500).get();
    return Response.json({ users: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
  } catch (error) { return fail(error); }
}
export async function PATCH(request) {
  try {
    const actor = await requireStaff(request, ["admin"]);
    const { uid, status } = await request.json();
    if (typeof uid !== "string" || !["active", "blocked"].includes(status)) throw new HttpError(400, "Données invalides");
    if (uid === actor.uid) throw new HttpError(403, "Modification de votre propre statut interdite");
    if (!uid || uid.includes("/")) throw new HttpError(400, "UID invalide");
    const db = adminDb();
    await db.runTransaction(async tx => {
      const userRef = db.collection("users").doc(uid);
      const partnerRef = db.collection("partners").doc(uid);
      const [user, partner] = await Promise.all([tx.get(userRef), tx.get(partnerRef)]);
      if (!user.exists) throw new HttpError(404, "Utilisateur introuvable");
      if (status === "blocked") {
        tx.update(userRef, { status, isPartner: false });
        if (partner.exists) {
          if (partner.data().uid !== uid) throw new HttpError(409, "Association commissionnaire incohérente");
          tx.update(partnerRef, { status: "suspended", updatedAt: Date.now() });
        }
      } else {
        // Le déblocage ne modifie pas les droits commissionnaires existants.
        // Un compte suspendu reste suspendu ; un compte actif ne perd pas ses droits.
        tx.update(userRef, { status });
      }
    });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}
