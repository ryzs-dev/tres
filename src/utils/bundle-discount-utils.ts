// src/utils/bundle-discount-utils.ts

export interface BundleDiscountConfig {
  discount_type: "fixed" | "percentage";
  discount_2_items?: number; // Percentage (0-100)
  discount_3_items?: number; // Percentage (0-100)
  discount_2_items_amount?: number; // Fixed amount in cents
  discount_3_items_amount?: number; // Fixed amount in cents
}

export interface DiscountResult {
  type: "fixed" | "percentage";
  amount?: number; // For fixed discounts (in cents)
  rate?: number; // For percentage discounts (0-1)
  displayText: string;
}

/**
 * Convert RM to cents
 */
export function rmToCents(rm: number): number {
  return Math.round(rm * 100);
}

/**
 * Convert cents to RM
 */
export function centsToRm(cents: number): number {
  return cents / 100;
}

/**
 * Format currency amount for display
 */
export function formatCurrency(cents: number, currency = "MYR"): string {
  const amount = centsToRm(cents);
  if (currency === "MYR") {
    return `RM${amount.toFixed(2)}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Calculate discount based on bundle configuration and item count
 */
export function calculateBundleDiscount(
  itemCount: number,
  bundleConfig: BundleDiscountConfig
): DiscountResult | null {
  // Check for fixed discount first (new system)
  if (
    bundleConfig.discount_type === "fixed" ||
    bundleConfig.discount_2_items_amount ||
    bundleConfig.discount_3_items_amount
  ) {
    let discountAmount = 0;

    if (itemCount === 2 && bundleConfig.discount_2_items_amount) {
      discountAmount = bundleConfig.discount_2_items_amount;
    } else if (itemCount >= 3 && bundleConfig.discount_3_items_amount) {
      discountAmount = bundleConfig.discount_3_items_amount;
    }

    if (discountAmount > 0) {
      return {
        type: "fixed",
        amount: discountAmount,
        displayText: `${formatCurrency(discountAmount)} off`,
      };
    }
  }

  // Fallback to percentage discount (backward compatibility)
  if (
    bundleConfig.discount_type === "percentage" ||
    bundleConfig.discount_2_items ||
    bundleConfig.discount_3_items
  ) {
    let discountPercentage = 0;

    if (itemCount === 2 && bundleConfig.discount_2_items) {
      discountPercentage = bundleConfig.discount_2_items;
    } else if (itemCount >= 3 && bundleConfig.discount_3_items) {
      discountPercentage = bundleConfig.discount_3_items;
    }

    if (discountPercentage > 0) {
      const rate = discountPercentage / 100;
      return {
        type: "percentage",
        rate: rate,
        displayText: `${discountPercentage}% off`,
      };
    }
  }

  return null;
}

/**
 * Apply fixed discount to cart items (distributes discount evenly)
 */
export function distributeFixedDiscount(
  totalDiscountAmount: number,
  cartItems: Array<{ id: string; originalPrice: number }>
): Array<{ itemId: string; discountAmount: number; finalPrice: number }> {
  if (cartItems.length === 0) return [];

  const perItemDiscount = Math.floor(totalDiscountAmount / cartItems.length);
  const remainder = totalDiscountAmount % cartItems.length;

  return cartItems.map((item, index) => {
    // Give remainder cents to first items
    const itemDiscount = perItemDiscount + (index < remainder ? 1 : 0);
    const finalPrice = Math.max(0, item.originalPrice - itemDiscount);

    return {
      itemId: item.id,
      discountAmount: itemDiscount,
      finalPrice: finalPrice,
    };
  });
}

/**
 * Apply percentage discount to a single item
 */
export function applyPercentageDiscount(
  originalPrice: number,
  discountRate: number
): { discountAmount: number; finalPrice: number } {
  const discountAmount = Math.round(originalPrice * discountRate);
  const finalPrice = originalPrice - discountAmount;

  return {
    discountAmount,
    finalPrice: Math.max(0, finalPrice),
  };
}

/**
 * Validate bundle discount configuration
 */
export function validateBundleDiscountConfig(
  config: BundleDiscountConfig
): string[] {
  const errors: string[] = [];

  if (config.discount_type === "fixed") {
    if (config.discount_2_items_amount && config.discount_2_items_amount < 0) {
      errors.push("2-item discount amount must be positive");
    }
    if (config.discount_3_items_amount && config.discount_3_items_amount < 0) {
      errors.push("3-item discount amount must be positive");
    }
  } else if (config.discount_type === "percentage") {
    if (
      config.discount_2_items &&
      (config.discount_2_items < 0 || config.discount_2_items > 100)
    ) {
      errors.push("2-item discount percentage must be between 0 and 100");
    }
    if (
      config.discount_3_items &&
      (config.discount_3_items < 0 || config.discount_3_items > 100)
    ) {
      errors.push("3-item discount percentage must be between 0 and 100");
    }
  }

  return errors;
}

/**
 * Generate bundle pricing preview text
 */
export function generateBundlePricingPreview(
  config: BundleDiscountConfig
): string[] {
  const preview: string[] = ["• 1 item = Regular price"];

  const discount2 = calculateBundleDiscount(2, config);
  const discount3 = calculateBundleDiscount(3, config);

  if (discount2) {
    preview.push(`• 2 items = ${discount2.displayText}`);
  } else {
    preview.push("• 2 items = Regular price");
  }

  if (discount3) {
    preview.push(`• 3+ items = ${discount3.displayText}`);
  } else {
    preview.push("• 3+ items = Regular price");
  }

  return preview;
}

// Example usage:
/*
  const bundleConfig: BundleDiscountConfig = {
    discount_type: "fixed",
    discount_2_items_amount: rmToCents(20), // 20 RM
    discount_3_items_amount: rmToCents(30)  // 30 RM
  };
  
  const discount = calculateBundleDiscount(2, bundleConfig);
  console.log(discount); // { type: "fixed", amount: 2000, displayText: "RM20.00 off" }
  
  const preview = generateBundlePricingPreview(bundleConfig);
  console.log(preview); 
  // ["• 1 item = Regular price", "• 2 items = RM20.00 off", "• 3+ items = RM30.00 off"]
  */
