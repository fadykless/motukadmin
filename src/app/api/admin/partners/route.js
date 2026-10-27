import { adminAuth, adminDb, requireStaff, fail, HttpError, requireString } from "@/lib/server/admin";
export async function GET(request) {
  try {
    const actor = await requireStaff(request);
    const snap = await adminDb().collection("partners").limit(500).get();
    const partners = snap.docs.map(doc => {
      const { phoneNumber, ...publicFields } = { id: doc.id, ...doc.data() };
      return actor.role === "admin" ? { ...publicFields, phoneNumber } : publicFields;
    });
    return Response.json({ partners });
  } catch (error) { return fail(error); }
}
export async function POST(request) {
  try {
    await requireStaff(request, ["admin"]);
    const { uid } = await request.json();
    const id = requireString(uid, "UID", 128);
    if (id.includes("/")) throw new HttpError(400, "UID invalide");
    let authAccount;
    try { authAccount = await adminAuth().getUser(id); }
    catch (error) { if (error.code === "auth/user-not-found") throw new HttpError(404, "Compte Firebase Authentication introuvable"); throw error; }
    if (authAccount.disabled) throw new HttpError(409, "Compte Firebase Authentication désactivé");
    const db = adminDb();
    const existing = await db.collection("partners").where("uid", "==", id).limit(2).get();
    if (!existing.empty) throw new HttpError(409, "Un profil commissionnaire est déjà associé à cet UID");
    const userRef = db.collection("users").doc(id);
    const partnerRef = db.collection("partners").doc(id);
    await db.runTransaction(async tx => {
      const [user, partner] = await Promise.all([tx.get(userRef), tx.get(partnerRef)]);
      if (!user.exists) throw new HttpError(404, "Compte utilisateur introuvable");
      if (["blocked", "disabled"].includes(user.data().status)) throw new HttpError(409, "Compte utilisateur désactivé");
      if (partner.exists) throw new HttpError(409, "Commissionnaire déjà enregistré");
      const profile = user.data();
      tx.create(partnerRef, { uid: id, displayName: profile.displayName || authAccount.displayName || "", phoneNumber: profile.phoneNumber || authAccount.phoneNumber || "", city: profile.city || "", role: "partner", partnerType: "commissionnaire", status: "pending", createdAt: Date.now() });
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
    if (status === "active") {
      let account;
      try { account = await adminAuth().getUser(id); }
      catch (error) { if (error.code === "auth/user-not-found") throw new HttpError(404, "Compte Firebase Authentication introuvable"); throw error; }
      if (account.disabled) throw new HttpError(409, "Compte Firebase Authentication désactivé");
    }
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
