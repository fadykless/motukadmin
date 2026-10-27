import { adminDb, requireStaff, fail, HttpError, requireString } from "@/lib/server/admin";
const STATUSES = ["init", "validated", "hidden", "sold"];
export async function POST(request) {
  try {
    const actor = await requireStaff(request);
    const body = await request.json();
    const name = requireString(body.name, "Nom", 200);
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) throw new HttpError(400, "Prix invalide");
    if (!Array.isArray(body.images) || body.images.length < 1 || body.images.length > 20 || !body.images.every(x => typeof x === "string" && x.startsWith("https://"))) throw new HttpError(400, "Images invalides");
    const allowed = ["name","price","description","etat","city","brand","model","year","mileage","engineType","fuel","transmission","rentType","rentPrice","images","alsoForRent","type"];
    const data = Object.fromEntries(allowed.filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]]));
    data.name = name; data.price = price;
    if (body.partner) throw new HttpError(409, "Publication commissionnaire à finaliser après liaison UID et consentement");
    const ref = await adminDb().collection("products").add({ ...data, listingOrigin: "direct", contactChannel: "seller", status: "validated", createdAt: Date.now(), createdByAdmin: actor.uid });
    return Response.json({ id: ref.id }, { status: 201 });
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
