import { adminAuth, adminDb, requireStaff, fail, HttpError, requireString } from "@/lib/server/admin";
export async function GET(request) {
  try {
    await requireStaff(request);
    const snap = await adminDb().collection("partners").limit(500).get();
    return Response.json({ partners: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
  } catch (error) { return fail(error); }
}
export async function POST(request) {
  try {
    await requireStaff(request, ["admin"]);
    const { uid, displayName, phoneNumber, city } = await request.json();
    const id = requireString(uid, "UID", 128);
    if (id.includes("/")) throw new HttpError(400, "UID invalide");
    try { await adminAuth().getUser(id); }
    catch (error) { if (error.code === "auth/user-not-found") throw new HttpError(404, "Compte Firebase Authentication introuvable"); throw error; }
    const db = adminDb();
    const userRef = db.collection("users").doc(id);
    const partnerRef = db.collection("partners").doc(id);
    await db.runTransaction(async tx => {
      const [user, partner] = await Promise.all([tx.get(userRef), tx.get(partnerRef)]);
      if (!user.exists) throw new HttpError(404, "Compte utilisateur introuvable");
      if (partner.exists) throw new HttpError(409, "Commissionnaire déjà enregistré");
      tx.create(partnerRef, { uid: id, displayName: requireString(displayName,"Nom",150), phoneNumber: requireString(phoneNumber,"Téléphone",30), city: requireString(city,"Ville",100), role: "partner", partnerType: "commissionnaire", status: "pending", createdAt: Date.now() });
      tx.update(userRef, { isPartner: false });
    });
    return Response.json({ id, status: "pending" }, { status: 201 });
  } catch (error) { return fail(error); }
}
export async function PATCH(request) {
  try {
    await requireStaff(request, ["admin"]);
    const { uid, status } = await request.json();
    const id = requireString(uid,"UID",128);
    if (id.includes("/")) throw new HttpError(400, "UID invalide");
    if (!["pending","active","suspended","disabled"].includes(status)) throw new HttpError(400,"Statut invalide");
    const db = adminDb(), userRef = db.collection("users").doc(id), partnerRef = db.collection("partners").doc(id);
    await db.runTransaction(async tx => {
      const [user, partner] = await Promise.all([tx.get(userRef), tx.get(partnerRef)]);
      if (!user.exists || !partner.exists) throw new HttpError(404,"Compte ou commissionnaire introuvable");
      if (partner.data().uid !== id) throw new HttpError(409,"Association UID incohérente");
      if (status === "active" && (user.data().status === "blocked" || user.data().status === "disabled")) throw new HttpError(409, "Compte utilisateur désactivé");
      tx.update(partnerRef, { status, updatedAt: Date.now() });
      tx.update(userRef, { isPartner: status === "active" });
    });
    return Response.json({ ok: true, isPartner: status === "active" });
  } catch (error) { return fail(error); }
}
