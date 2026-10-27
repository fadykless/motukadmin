import { adminDb, requireStaff, fail, HttpError } from "@/lib/server/admin";

export const runtime = "nodejs";

const STATUSES = new Set(["new", "contacted", "qualified", "in_progress", "closed"]);
const validId = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const validDate = value => {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export async function GET(request) {
  try {
    await requireStaff(request);
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const commissionnaireId = params.get("commissionnaireId");
    const productId = params.get("productId");
    const assignedTo = params.get("assignedTo");
    const from = params.get("from");
    const to = params.get("to");
    const cursor = params.get("cursor");
    const limit = Number(params.get("limit") || 20);

    if (status && !STATUSES.has(status)) throw new HttpError(400, "Statut invalide");
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new HttpError(400, "Pagination invalide");
    for (const value of [commissionnaireId, productId, assignedTo, cursor]) {
      if (value !== null && !validId(value)) throw new HttpError(400, "Identifiant de filtre invalide");
    }
    for (const value of [from, to]) {
      if (value !== null && !validDate(value)) throw new HttpError(400, "Date invalide");
    }
    if (from && to && from > to) throw new HttpError(400, "Période invalide");

    const db = adminDb();
    let query = db.collection("contactRequests").where("contactChannel", "==", "motuka");
    if (status) query = query.where("status", "==", status);
    if (commissionnaireId) query = query.where("commissionnaireId", "==", commissionnaireId);
    if (productId) query = query.where("productId", "==", productId);
    if (assignedTo) query = query.where("assignedTo", "==", assignedTo);
    if (from) query = query.where("createdAt", ">=", new Date(from + "T00:00:00.000Z"));
    if (to) query = query.where("createdAt", "<", new Date(Date.parse(to + "T00:00:00.000Z") + 86400000));
    query = query.orderBy("createdAt", "desc").orderBy("__name__", "desc");
    if (cursor) {
      const cursorDoc = await db.collection("contactRequests").doc(cursor).get();
      if (!cursorDoc.exists || !cursorDoc.get("createdAt")) throw new HttpError(400, "Curseur invalide");
      query = query.startAfter(cursorDoc);
    }

    const items = [];
    let last = null;
    let exhausted = false;
    for (let batchNumber = 0; batchNumber < 10 && items.length < limit; batchNumber++) {
      const snap = await query.limit(50).get();
      if (snap.empty) { exhausted = true; break; }
      const ids = [...new Set(snap.docs.map(doc => doc.get("productId")).filter(validId))];
      const products = ids.length ? await db.getAll(...ids.map(id => db.collection("products").doc(id))) : [];
      const byId = new Map(products.map(doc => [doc.id, doc.exists ? doc.data() : null]));
      const partnerIds = [...new Set(snap.docs.map(doc => doc.get("commissionnaireId")).filter(validId))];
      const partners = partnerIds.length ? await db.getAll(...partnerIds.map(id => db.collection("users").doc(id))) : [];
      const activePartners = new Set(partners.filter(doc => doc.exists && doc.get("isPartner") === true).map(doc => doc.id));
      let inspected = 0;
      for (const doc of snap.docs) {
        inspected++;
        last = doc;
        const value = doc.data();
        const product = byId.get(value.productId);
        if (!activePartners.has(value.commissionnaireId) || !product || product.listingOrigin !== "commissionnaire" ||
            product.commissionnaireId !== value.commissionnaireId) continue;
        items.push({
          id: doc.id,
          productId: value.productId,
          productName: typeof product.name === "string" ? product.name : "",
          buyerId: value.buyerId || null,
          commissionnaireId: value.commissionnaireId,
          status: value.status || "new",
          assignedTo: value.assignedTo || null,
          createdAt: value.createdAt?.toDate?.()?.toISOString() || null
        });
        if (items.length === limit) break;
      }
      if (snap.size < 50 && inspected === snap.size) { exhausted = true; break; }
      query = query.startAfter(last);
    }
    return Response.json({ items, nextCursor: exhausted || !last ? null : last.id });
  } catch (error) {
    return fail(error);
  }
}
