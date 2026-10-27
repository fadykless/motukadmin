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
    if (typeof uid !== "string" || !["active", "blocked"].includes(status)) throw new HttpError(400, "Données invalides");
    if (uid === actor.uid) throw new HttpError(403, "Modification de votre propre statut interdite");
    if (!uid || uid.includes("/")) throw new HttpError(400, "UID invalide");
    const db = adminDb();
    await db.runTransaction(async tx => {
      const ref = db.collection("users").doc(uid);
      const user = await tx.get(ref);
      if (!user.exists) throw new HttpError(404, "Utilisateur introuvable");
      tx.update(ref, status === "blocked" ? { status, isPartner: false } : { status });
    });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}
