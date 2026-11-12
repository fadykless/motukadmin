// Missing versions are historical v0; malformed persisted versions must not reset to 0.
export function prospectVersion(value) {
  if (value === undefined) return 0;
  return Number.isSafeInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER ? value : null;
}
export function nextAssignee(previous, patch) {
  return Object.hasOwn(patch, "assignedTo") ? patch.assignedTo : previous.assignedTo ?? null;
}
