export const DECISION_ACTIONS = Object.freeze(["approve", "reject"]);

export function validatePartnerDecision(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Décision invalide" };
  }
  const { action, expectedVersion } = payload;
  if (!DECISION_ACTIONS.includes(action) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
    return { ok: false, error: "Décision invalide" };
  }
  if (action === "reject") {
    if (typeof payload.reason !== "string" || !payload.reason.trim() || payload.reason.length > 1000) {
      return { ok: false, error: "Motif invalide" };
    }
  }
  return { ok: true, action, expectedVersion, reason: action === "reject" ? payload.reason.trim() : null };
}

export function evaluatePartnerDecision(application, user, expectedVersion, uid) {
  if (!application) return { ok: false, status: 404, error: "Candidature introuvable" };
  if (!user) return { ok: false, status: 409, error: "Profil introuvable" };
  const version = Number.isSafeInteger(application.decisionVersion) ? application.decisionVersion : 0;
  if (application.status !== "pending" || version !== expectedVersion) return { ok: false, status: 409, error: "Dossier modifié, rechargez-le" };
  if (["blocked", "disabled"].includes(user.status) || user.isPartner === true) return { ok: false, status: 409, error: "Compte inéligible" };
  if (application.userId && application.userId !== uid) return { ok: false, status: 409, error: "Candidature incohérente" };
  return { ok: true, version };
}
