export function eligibleProspect(value, product, partner) {
  return value?.contactChannel === "motuka" &&
    typeof value.productId === "string" &&
    typeof value.commissionnaireId === "string" &&
    product?.listingOrigin === "commissionnaire" &&
    product.commissionnaireId === value.commissionnaireId &&
    partner?.isPartner === true;
}
