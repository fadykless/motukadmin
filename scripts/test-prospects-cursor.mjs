import assert from "node:assert/strict";
import test from "node:test";
import { cursorMatchesFilters } from "../src/lib/server/prospect-cursor.mjs";

const record = {
  contactChannel: "motuka", status: "new", commissionnaireId: "partner1",
  productId: "car1", assignedTo: "staff1",
  createdAt: { toMillis: () => Date.parse("2026-10-20T12:00:00Z") }
};

test("cursor matches active filters and inclusive calendar range", () => {
  assert.equal(cursorMatchesFilters(record, { status: "new", from: "2026-10-20", to: "2026-10-20" }), true);
});
test("cursor rejects mismatched identity or date filters", () => {
  assert.equal(cursorMatchesFilters(record, { productId: "other" }), false);
  assert.equal(cursorMatchesFilters(record, { from: "2026-10-21" }), false);
  assert.equal(cursorMatchesFilters(record, { to: "2026-10-19" }), false);
});
test("cursor rejects invalid records", () => {
  assert.equal(cursorMatchesFilters({ ...record, contactChannel: "external" }, {}), false);
  assert.equal(cursorMatchesFilters({ ...record, createdAt: null }, {}), false);
});
