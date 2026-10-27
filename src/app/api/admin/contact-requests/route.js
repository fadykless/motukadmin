import { adminDb, requireStaff, fail, HttpError } from "@/lib/server/admin";

export const runtime = "nodejs";

const STATUSES = ["new", "contacted", "qualified", "in_progress", "closed"];

export async function GET(request) {
  try {
    await requireStaff(request);
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const limit = Number(params.get("limit") || 20);
    if (status && !STATUSES.includes(status)) throw new HttpError(400, "Statut invalide");
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new HttpError(400, "Pagination invalide");

    let query = adminDb().collection("contactRequests");
    if (status) query = query.where("status", "==", status);
    query = query.orderBy("createdAt", "desc").limit(limit + 1);
    const result = await query.get();
    const docs = result.docs.slice(0, limit);
    return Response.json({
      items: docs.map(doc => {
        const value = doc.data();
        return {
          id: doc.id,
          productId: value.productId || null,
          buyerId: value.buyerId || null,
          commissionnaireId: value.commissionnaireId || null,
          status: value.status || "new",
          assignedTo: value.assignedTo || null,
          createdAt: value.createdAt?.toDate?.()?.toISOString() || null
        };
      }),
      hasMore: result.size > limit
    });
  } catch (error) {
    return fail(error);
  }
}
