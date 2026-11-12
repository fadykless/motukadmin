import assert from "node:assert/strict";
import test from "node:test";
import { validDate } from "../src/lib/server/prospect-dates.mjs";

test("valid calendar dates", () => {
  assert.equal(validDate("2026-10-27"), true);
  assert.equal(validDate("2024-02-29"), true);
});
test("invalid calendar dates", () => {
  for (const value of ["2026-02-29", "2026-02-31", "2026-13-01", "2026-00-01", "2026-1-01", ""]) {
    assert.equal(validDate(value), false, value);
  }
});
