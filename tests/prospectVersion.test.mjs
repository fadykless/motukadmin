import test from "node:test";
import assert from "node:assert/strict";
import { prospectVersion, nextAssignee } from "../src/lib/server/prospect-version.mjs";
test("legacy version defaults to zero while invalid persisted versions remain invalid", () => {
  assert.equal(prospectVersion(undefined), 0);
  assert.equal(prospectVersion(3), 3);
  for (const v of [null, "0", -1, 1.5, Number.MAX_SAFE_INTEGER]) assert.equal(prospectVersion(v), null);
});
test("explicit unassignment is retained in the same state used for audit", () => {
  assert.equal(nextAssignee({ assignedTo: "staff-old" }, { assignedTo: null }), null);
  assert.equal(nextAssignee({ assignedTo: "staff-old" }, {}), "staff-old");
  assert.equal(nextAssignee({}, { assignedTo: "staff-new" }), "staff-new");
  assert.equal(nextAssignee({}, {}), null);
});
