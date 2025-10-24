export const getDiscountInfo = (itemCount: number, bundle: any) => {
  // Priority 1: Fixed discount amounts (new system)
  if (
    bundle.discount_type === "fixed" ||
    bundle.discount_2_items_amount ||
    bundle.discount_3_items_amount
  ) {
    let fixedDiscountAmount = 0; // in cents

    if (itemCount === 2 && bundle.discount_2_items_amount) {
      fixedDiscountAmount = bundle.discount_2_items_amount;
    } else if (itemCount >= 3 && bundle.discount_3_items_amount) {
      fixedDiscountAmount = bundle.discount_3_items_amount;
    }

    if (fixedDiscountAmount > 0) {
      return {
        type: "fixed",
        fixedDiscountAmount, // in cents
        discountRate: 0, // not applicable for fixed
        discountPercentage: 0, // not applicable for fixed
      };
    }
  }

  // Priority 2: Percentage discounts (backward compatibility)
  let rate = 0;
  if (itemCount === 2 && bundle.discount_2_items) {
    rate = Number(bundle.discount_2_items) / 100;
  } else if (itemCount >= 3 && bundle.discount_3_items) {
    rate = Number(bundle.discount_3_items) / 100;
  }

  if (rate > 0) {
    return {
      type: "percentage",
      fixedDiscountAmount: 0, // not applicable for percentage
      discountRate: Math.round(rate * 10000) / 10000, // Round to avoid floating point issues
      discountPercentage: Math.round(rate * 100),
    };
  }

  return {
    type: "none",
    fixedDiscountAmount: 0,
    discountRate: 0,
    discountPercentage: 0,
  };
};
