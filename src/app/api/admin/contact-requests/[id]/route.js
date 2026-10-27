import { adminAuth, adminDb, requireStaff, fail, HttpError, requireString } from "@/lib/server/admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const STATUSES = new Set(["new", "contacted", "qualified", "in_progress", "closed"]);
const REASONS = new Set(["not_interested", "unreachable", "vehicle_unavailable", "duplicate", "completed", "other"]);

function id(value, label) {
  const result = requireString(value, label, 128);
  if (!/^[A-Za-z0-9_-]+$/.test(result)) throw new HttpError(400, label + " invalide");
  return result;
}

export async function GET(request, { params }) {
  try {
    await requireStaff(request);
    const { id: rawId } = await params;
    const prospectId = id(rawId, "Prospect");
    const db = adminDb();
    const snap = await db.collection("contactRequests").doc(prospectId).get();
    if (!snap.exists) throw new HttpError(404, "Prospect introuvable");
    const value = snap.data();
    const history = await snap.ref.collection("history").orderBy("createdAt", "desc").limit(50).get();
    return Response.json({
      prospect: {
        id: snap.id,
        productId: value.productId,
        buyerId: value.buyerId,
        commissionnaireId: value.commissionnaireId,
        status: value.status || "new",
        assignedTo: value.assignedTo || null,
        closedReason: value.closedReason || null,
        closedComment: value.closedComment || null,
        createdAt: value.createdAt?.toDate?.()?.toISOString() || null
      },
      history: history.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
      }))
    });
  } catch (error) { return fail(error); }
}

export async function PATCH(request, { params }) {
  try {
    const actor = await requireStaff(request);
    const { id: rawId } = await params;
    const prospectId = id(rawId, "Prospect");
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Corps invalide");
    const allowed = new Set(["status", "assignedTo", "closedReason", "closedComment"]);
    if (!Object.keys(body).length || Object.keys(body).some(key => !allowed.has(key))) throw new HttpError(400, "Champs interdits");
    if ("status" in body && !STATUSES.has(body.status)) throw new HttpError(400, "Statut invalide");
    if ("assignedTo" in body && body.assignedTo !== null) id(body.assignedTo, "Responsable");
    if ("closedReason" in body && body.closedReason !== null && !REASONS.has(body.closedReason)) throw new HttpError(400, "Motif invalide");
    if ("closedComment" in body && (typeof body.closedComment !== "string" || body.closedComment.length > 1000)) throw new HttpError(400, "Commentaire invalide");

    const db = adminDb();
    if (body.assignedTo) {
      const assigned = await db.collection("users").doc(body.assignedTo).get();
      if (!assigned.exists || !["admin", "manager"].includes(assigned.data().role) || ["blocked", "disabled"].includes(assigned.data().status)) throw new HttpError(400, "Responsable non autorisé");
      let account;
      try { account = await adminAuth().getUser(body.assignedTo); }
      catch (error) {
        if (error.code === "auth/user-not-found") throw new HttpError(400, "Compte du responsable introuvable");
        throw error;
      }
      if (account.disabled) throw new HttpError(400, "Compte du responsable désactivé");
    }
    const ref = db.collection("contactRequests").doc(prospectId);
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new HttpError(404, "Prospect introuvable");
      const previous = snap.data();
      if (!previous.productId || !previous.buyerId || !previous.commissionnaireId) throw new HttpError(409, "Références du prospect incomplètes");
      const [product, buyer, commissionnaire] = await Promise.all([
        tx.get(db.collection("products").doc(id(previous.productId, "Véhicule"))),
        tx.get(db.collection("users").doc(id(previous.buyerId, "Acheteur"))),
        tx.get(db.collection("users").doc(id(previous.commissionnaireId, "Commissionnaire")))
      ]);
      if (!product.exists || !buyer.exists || !commissionnaire.exists) throw new HttpError(409, "Référence du prospect introuvable");
      if (product.data().listingOrigin !== "commissionnaire" || product.data().commissionnaireId !== previous.commissionnaireId) throw new HttpError(409, "Prospect hors périmètre commissionnaire");
      const status = body.status ?? previous.status ?? "new";
      const reason = status === "closed" ? (body.closedReason ?? previous.closedReason) : null;
      const comment = status === "closed" ? (body.closedComment ?? previous.closedComment ?? null) : null;
      if (status === "closed" && !REASONS.has(reason)) throw new HttpError(400, "Motif de clôture obligatoire");
      if (status === "closed" && reason === "other" && !String(comment || "").trim()) throw new HttpError(400, "Commentaire obligatoire");
      const update = {
        status,
        closedReason: reason,
        closedComment: comment,
        updatedBy: actor.uid,
        updatedAt: FieldValue.serverTimestamp()
      };
      if ("assignedTo" in body) update.assignedTo = body.assignedTo;
      tx.update(ref, update);
      tx.create(ref.collection("history").doc(), {
        prospectId,
        action: "update",
        actorId: actor.uid,
        before: { status: previous.status || "new", assignedTo: previous.assignedTo || null, closedReason: previous.closedReason || null },
        after: { status, assignedTo: update.assignedTo ?? previous.assignedTo ?? null, closedReason: reason },
        createdAt: FieldValue.serverTimestamp()
      });
    });
    return Response.json({ ok: true, id: prospectId });
  } catch (error) { return fail(error); }
}
