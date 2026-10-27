export const CLOSED_REASONS = new Set(["not_interested", "unreachable", "vehicle_unavailable", "duplicate", "completed", "other"]);

export function validateClosure(status, reason, comment) {
  if (status !== "closed") return true;
  if (!CLOSED_REASONS.has(reason)) return false;
  return reason !== "other" || (typeof comment === "string" && comment.trim().length > 0);
}
