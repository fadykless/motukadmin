import assert from "node:assert/strict";
import test from "node:test";
import { validateClosure } from "../src/lib/server/prospect-closure.mjs";

test("non-closed prospects need no closure reason", () => {
  assert.equal(validateClosure("qualified", null, null), true);
});
test("closed prospects require a valid reason", () => {
  assert.equal(validateClosure("closed", null, null), false);
  assert.equal(validateClosure("closed", "unknown", null), false);
  assert.equal(validateClosure("closed", "completed", null), true);
});
test("other reason requires meaningful comment", () => {
  assert.equal(validateClosure("closed", "other", ""), false);
  assert.equal(validateClosure("closed", "other", "   "), false);
  assert.equal(validateClosure("closed", "other", "Client à rappeler"), true);
});
