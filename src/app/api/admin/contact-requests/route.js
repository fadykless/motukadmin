import { adminDb, requireStaff, fail, HttpError } from "@/lib/server/admin";

export const runtime = "nodejs";

const STATUSES = new Set(["new", "contacted", "qualified", "in_progress", "closed"]);
const validId = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"));

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

    const result = await query.limit(limit + 1).get();
    const docs = result.docs.slice(0, limit);
    const productIds = [...new Set(docs.map(doc => doc.get("productId")).filter(validId))];
    const productSnaps = productIds.length
      ? await db.getAll(...productIds.map(productId => db.collection("products").doc(productId)))
      : [];
    const commissionnaireProducts = new Map(productSnaps.map(snap => [
      snap.id,
      snap.exists && snap.get("listingOrigin") === "commissionnaire"
        ? snap.get("commissionnaireId") : null
    ]));
    return Response.json({
      items: docs.filter(doc => {
        const value = doc.data();
        return validId(value.productId) &&
          validId(value.commissionnaireId) &&
          commissionnaireProducts.get(value.productId) === value.commissionnaireId;
      }).map(doc => {
        const value = doc.data();
        return {
          id: doc.id,
          productId: value.productId || null,
          buyerId: value.buyerId || null,
          commissionnaireId: value.commissionnaireId || null,
          status: value.status || "new",
          assignedTo: value.assignedTo || null,
          closedReason: value.closedReason || null,
          createdAt: value.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: value.updatedAt?.toDate?.()?.toISOString() || null
        };
      }),
      nextCursor: result.size > limit ? docs[docs.length - 1].id : null
    });
  } catch (error) {
    return fail(error);
  }
}
