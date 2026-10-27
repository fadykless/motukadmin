import { adminDb, requireStaff, fail, HttpError, requireString } from "@/lib/server/admin";
const STATUSES = ["init", "validated", "hidden", "sold"];
export async function POST(request) {
  try {
    await requireStaff(request);
    throw new HttpError(409, "Publication administrative temporairement indisponible : validation du propriétaire, consentement et stockage privé nécessaires");
  } catch (error) { return fail(error); }
}
export async function PATCH(request) {
  try {
    await requireStaff(request);
    const { ids, status } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100 || !ids.every(id => typeof id === "string" && id.length > 0 && !id.includes("/")) || !STATUSES.includes(status)) throw new HttpError(400, "Données invalides");
    const db = adminDb();
    await db.runTransaction(async tx => {
      const refs = [...new Set(ids)].map(id => db.collection("products").doc(id));
      const snaps = await Promise.all(refs.map(ref => tx.get(ref)));
      if (snaps.some(s => !s.exists)) throw new HttpError(404, "Annonce introuvable");
      snaps.forEach(s => tx.update(s.ref, { status, updatedAt: Date.now() }));
    });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}
export async function DELETE(request) {
  try {
    await requireStaff(request, ["admin"]);
    const { ids } = await request.json();
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || !ids.every(id => typeof id === "string" && id && !id.includes("/"))) throw new HttpError(400, "Identifiants invalides");
    const db = adminDb();
    await db.runTransaction(async tx => {
      const refs = [...new Set(ids)].map(id => db.collection("products").doc(id));
      const snaps = await Promise.all(refs.map(ref => tx.get(ref)));
      if (snaps.some(s => !s.exists)) throw new HttpError(404, "Annonce introuvable");
      snaps.forEach(s => tx.update(s.ref, { status: "hidden", deletedAt: Date.now() }));
    });
    return Response.json({ ok: true, archived: true });
  } catch (error) { return fail(error); }
}
