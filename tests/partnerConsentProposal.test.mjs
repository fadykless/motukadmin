import test from "node:test";
import assert from "node:assert/strict";
import { evaluateProposedConsent as evaluate } from "../proposals/partnerConsentGuard.mjs";
const refs = [{ version: "test-version", sha256: "a".repeat(64), method: "authenticated_checkbox" }];
const app = { userId: "candidate", termsVersion: "test-version", termsDocumentSha256: "a".repeat(64),
  termsAcceptanceMethod: "authenticated_checkbox", termsAcceptedAt: { toDate: () => new Date("2026-11-11T10:00:00Z") } };
test("proposal accepts only the exact explicitly provided reference", () => {
  assert.deepEqual(evaluate(app, "candidate", refs), { ok: true });
  for (const change of [{ termsVersion: "other" }, { termsDocumentSha256: "b".repeat(64) }, { termsAcceptanceMethod: "other" }]) {
    assert.equal(evaluate({ ...app, ...change }, "candidate", refs).code, "CONSENT_REFERENCE_UNKNOWN");
  }
});
test("proposal refuses missing and partial consent without modifying the application", () => {
  const legacy = { userId: "candidate" };
  assert.equal(evaluate(legacy, "candidate", refs).ok, false);
  assert.deepEqual(legacy, { userId: "candidate" });
  for (const field of ["termsVersion", "termsDocumentSha256", "termsAcceptanceMethod", "termsAcceptedAt"]) {
    const partial = { ...app }; delete partial[field];
    assert.equal(evaluate(partial, "candidate", refs).ok, false, field);
  }
});
test("proposal refuses mismatched or absent identity", () => {
  assert.equal(evaluate(app, "foreign", refs).code, "CONSENT_IDENTITY_MISMATCH");
  assert.equal(evaluate({ ...app, userId: undefined }, "candidate", refs).ok, false);
});
test("proposal refuses malformed hashes, dates, and missing registry", () => {
  for (const hash of ["a", "g".repeat(64), null, 5]) assert.equal(evaluate({ ...app, termsDocumentSha256: hash }, "candidate", refs).ok, false);
  for (const date of ["2026-11-11", new Date(), { toDate: () => new Date(NaN) }, { toDate: () => { throw Error(); } }]) {
    assert.equal(evaluate({ ...app, termsAcceptedAt: date }, "candidate", refs).code, "CONSENT_DATE_INVALID");
  }
  for (const registry of [undefined, [], {}]) assert.equal(evaluate(app, "candidate", registry).code, "CONSENT_REFERENCE_NOT_CONFIGURED");
});
