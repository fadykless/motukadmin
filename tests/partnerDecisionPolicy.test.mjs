import test from "node:test";
import assert from "node:assert/strict";
import { validatePartnerDecision, evaluatePartnerDecision } from "../src/lib/partnerDecisionPolicy.mjs";

test("approbation valide sans motif", () => {
  assert.deepEqual(validatePartnerDecision({ action: "approve", expectedVersion: 0 }), { ok: true, action: "approve", expectedVersion: 0, reason: null });
});
test("refus exige un motif et le nettoie", () => {
  assert.equal(validatePartnerDecision({ action: "reject", expectedVersion: 0 }).ok, false);
  assert.equal(validatePartnerDecision({ action: "reject", expectedVersion: 0, reason: "   " }).ok, false);
  assert.equal(validatePartnerDecision({ action: "reject", expectedVersion: 0, reason: " x ".repeat(501) }).ok, false);
  assert.equal(validatePartnerDecision({ action: "reject", expectedVersion: 0, reason: "  Motif  " }).reason, "Motif");
});
test("actions et versions invalides", () => {
  for (const value of [null, [], {}, { action: "delete", expectedVersion: 0 }, { action: "approve", expectedVersion: -1 }, { action: "approve", expectedVersion: 1.5 }]) {
    assert.equal(validatePartnerDecision(value).ok, false);
  }
});
test("dossier pending historique sans version accepté", () => {
  assert.deepEqual(evaluatePartnerDecision({ status: "pending" }, { isPartner: false, status: "active" }, 0, "u1"), { ok: true, version: 0 });
});
test("version obsolète ou dossier déjà décidé rejeté", () => {
  assert.equal(evaluatePartnerDecision({ status: "pending", decisionVersion: 2 }, { isPartner: false }, 1, "u1").status, 409);
  assert.equal(evaluatePartnerDecision({ status: "approved", decisionVersion: 1 }, { isPartner: false }, 1, "u1").status, 409);
});
test("comptes inéligibles rejetés", () => {
  for (const user of [{ status: "blocked" }, { status: "disabled" }, { isPartner: true }]) {
    assert.equal(evaluatePartnerDecision({ status: "pending" }, user, 0, "u1").status, 409);
  }
});
test("candidature liée à un autre utilisateur rejetée", () => {
  assert.equal(evaluatePartnerDecision({ status: "pending", userId: "u2" }, { isPartner: false }, 0, "u1").status, 409);
});
test("candidature et profil absents", () => {
  assert.equal(evaluatePartnerDecision(null, {}, 0, "u1").status, 404);
  assert.equal(evaluatePartnerDecision({ status: "pending" }, null, 0, "u1").status, 409);
});

test("versions hors limites et payloads non objets rejetés", () => {
  for (const payload of [
    "approve", 1, true, { action: "approve", expectedVersion: NaN },
    { action: "approve", expectedVersion: Infinity },
    { action: "approve", expectedVersion: Number.MAX_SAFE_INTEGER + 1 },
    { action: "reject", expectedVersion: 0, reason: 123 },
    { action: "reject", expectedVersion: 0, reason: "" },
  ]) {
    assert.equal(validatePartnerDecision(payload).ok, false);
  }
});
test("refus conserve la version et le motif nettoyé", () => {
  assert.deepEqual(validatePartnerDecision({ action: "reject", expectedVersion: 3, reason: "  Pièces insuffisantes  " }), {
    ok: true, action: "reject", expectedVersion: 3, reason: "Pièces insuffisantes",
  });
});
test("décision impossible après refus ou approbation, même sans droit actif", () => {
  for (const status of ["approved", "rejected"]) {
    assert.equal(evaluatePartnerDecision({ status, decisionVersion: 1 }, { isPartner: false, status: "active" }, 1, "u1").status, 409);
  }
});
test("compte actif et candidature cohérente autorisés uniquement à la version attendue", () => {
  const app = { status: "pending", userId: "u1", decisionVersion: 4 };
  const user = { status: "active", isPartner: false };
  assert.deepEqual(evaluatePartnerDecision(app, user, 4, "u1"), { ok: true, version: 4 });
  assert.equal(evaluatePartnerDecision(app, user, 3, "u1").status, 409);
  assert.equal(evaluatePartnerDecision(app, { ...user, isPartner: true }, 4, "u1").status, 409);
});
