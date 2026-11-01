import { adminDb, requireStaff, fail, HttpError } from "@/lib/server/admin";
import { FieldPath } from "firebase-admin/firestore";

const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);

function boundedLimit(value) {
  if (value === null) return 20;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 50) throw new HttpError(400, "Limite invalide (1 à 50)");
  return n;
}

export async function GET(request) {
  try {
    const actor = await requireStaff(request, ["admin", "manager"]);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    if (status && !VALID_STATUSES.has(status)) throw new HttpError(400, "Statut invalide");
    const limit = boundedLimit(url.searchParams.get("limit"));
    const cursor = url.searchParams.get("cursor");
    if (cursor && (cursor.length > 128 || cursor.includes("/"))) throw new HttpError(400, "Curseur invalide");

    const db = adminDb();
    let query = db.collection("partnerApplications");
    if (status) query = query.where("status", "==", status);
    query = query.orderBy(FieldPath.documentId());
    if (cursor) {
      const previous = await db.collection("partnerApplications").doc(cursor).get();
      if (!previous.exists || (status && previous.data().status !== status)) {
        throw new HttpError(400, "Curseur introuvable ou incompatible");
      }
      query = query.startAfter(previous);
    }
    const snapshot = await query.limit(limit + 1).get();
    const hasMore = snapshot.docs.length > limit;
    const docs = snapshot.docs.slice(0, limit);
    const applications = docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        fullName: data.fullName || "",
        city: data.city || "",
        status: VALID_STATUSES.has(data.status) ? data.status : "unknown",
        submittedAt: data.createdAt?.toDate?.()?.toISOString() || null,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || null,
        ...(actor.role === "admin" ? { phone: data.phone || "" } : {}),
      };
    });
    return Response.json({
      applications,
      nextCursor: hasMore && docs.length ? docs[docs.length - 1].id : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
