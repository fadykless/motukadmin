// A02 proposal only. Not imported by an application route; PM/Legal approval required.
export function evaluateProposedConsent(application, uid, approvedReferences) {
  if (!Array.isArray(approvedReferences) || approvedReferences.length === 0) {
    return { ok: false, code: "CONSENT_REFERENCE_NOT_CONFIGURED" };
  }
  if (typeof uid !== "string" || !uid || !application || application.userId !== uid) return { ok: false, code: "CONSENT_IDENTITY_MISMATCH" };
  const { termsVersion: version, termsDocumentSha256: hash, termsAcceptanceMethod: method } = application;
  if (typeof version !== "string" || !version.trim() || typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash) ||
      typeof method !== "string" || !method) return { ok: false, code: "CONSENT_INCOMPLETE" };
  let date;
  try { date = application.termsAcceptedAt?.toDate?.(); } catch { /* invalid persisted value */ }
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return { ok: false, code: "CONSENT_DATE_INVALID" };
  const known = approvedReferences.some(ref => ref?.version === version && ref?.sha256 === hash && ref?.method === method);
  return known ? { ok: true } : { ok: false, code: "CONSENT_REFERENCE_UNKNOWN" };
}
