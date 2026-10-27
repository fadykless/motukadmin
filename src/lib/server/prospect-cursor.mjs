export function cursorMatchesFilters(value, filters) {
  if (!value || value.contactChannel !== "motuka") return false;
  for (const key of ["status", "commissionnaireId", "productId", "assignedTo"]) {
    if (filters[key] && value[key] !== filters[key]) return false;
  }
  const createdAt = value.createdAt?.toMillis?.();
  if (!Number.isFinite(createdAt)) return false;
  if (filters.from && createdAt < Date.parse(filters.from + "T00:00:00.000Z")) return false;
  if (filters.to && createdAt >= Date.parse(filters.to + "T00:00:00.000Z") + 86400000) return false;
  return true;
}
