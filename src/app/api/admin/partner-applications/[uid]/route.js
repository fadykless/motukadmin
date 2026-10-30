import { adminDb, requireStaff, fail, HttpError } from "@/lib/server/admin";

const STATUSES = new Set(["pending", "approved", "rejected"]);

export async function GET(request, context) {
  try {
    const actor = await requireStaff(request, ["admin", "manager"]);
    const { uid } = await context.params;
    if (typeof uid !== "string" || !uid || uid.length > 128 || uid.includes("/")) {
      throw new HttpError(400, "Identifiant invalide");
    }
    const db = adminDb();
    const [application, profile, history] = await Promise.all([
      db.collection("partnerApplications").doc(uid).get(),
      db.collection("users").doc(uid).get(),
      db.collection("partnerApplications").doc(uid).collection("history").orderBy("createdAt", "desc").limit(50).get(),
    ]);
    if (!application.exists) throw new HttpError(404, "Candidature introuvable");
    const data = application.data();
    const user = profile.data() || {};
    return Response.json({
      canDecide: actor.role === "admin",
      application: {
        uid,
        fullName: data.fullName || "",
        city: data.city || "",
        motivation: data.motivation || "",
        experience: data.experience || "",
        status: STATUSES.has(data.status) ? data.status : "unknown",
        submittedAt: data.createdAt?.toDate?.()?.toISOString() || null,
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || null,
        decisionVersion: Number.isInteger(data.decisionVersion) ? data.decisionVersion : 0,
        ...(actor.role === "admin" ? { phone: data.phone || "", rejectionReason: data.rejectionReason || null } : {}),
      },
      partner: {
        isPartner: user.isPartner === true,
        accountStatus: user.status || "unknown",
        profileExists: profile.exists,
      },
      history: history.docs.map(doc => {
        const item = doc.data();
        return {
          id: doc.id,
          action: item.action || "unknown",
          actorUid: item.actorUid || null,
          reason: actor.role === "admin" ? item.reason || null : null,
          createdAt: item.createdAt?.toDate?.()?.toISOString() || null,
        };
      }),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
