import assert from "node:assert/strict";
import test from "node:test";
import { eligibleProspect } from "../src/lib/server/prospect-eligibility.mjs";

const request = { contactChannel: "motuka", productId: "car1", commissionnaireId: "partner1" };
const product = { listingOrigin: "commissionnaire", commissionnaireId: "partner1" };
const partner = { isPartner: true };

test("accepts commissionnaire prospect linked to active partner", () => {
  assert.equal(eligibleProspect(request, product, partner), true);
});
test("rejects mismatched partner, inactive partner and ordinary listing", () => {
  assert.equal(eligibleProspect(request, { ...product, commissionnaireId: "partner2" }, partner), false);
  assert.equal(eligibleProspect(request, product, { isPartner: false }), false);
  assert.equal(eligibleProspect(request, { ...product, listingOrigin: "seller" }, partner), false);
  assert.equal(eligibleProspect({ ...request, contactChannel: "external" }, product, partner), false);
  assert.equal(eligibleProspect(request, null, partner), false);
});
