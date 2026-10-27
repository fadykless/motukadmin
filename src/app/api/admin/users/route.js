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
    const ref = adminDb().collection("users").doc(uid);
    if (!(await ref.get()).exists) throw new HttpError(404, "Utilisateur introuvable");
    await ref.update({ status });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}
