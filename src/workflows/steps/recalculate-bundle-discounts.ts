// src/workflows/steps/recalculate-bundle-discounts.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { container } from "@medusajs/framework";

type RecalculateBundleDiscountsInput = {
  cart: any;
  specific_bundle_id?: string;
};

export const recalculateBundleDiscountsStep = createStep(
  "recalculate-bundle-discounts",
  async ({ cart, specific_bundle_id }: RecalculateBundleDiscountsInput) => {
    console.log(`🔄 Recalculating bundle discounts for cart ${cart.id}`);

    const query = container.resolve("query");
    const cartModuleService = container.resolve("cart");
    const results: any[] = [];

    try {
      // Group cart items by bundle
      const bundleGroups = new Map<string, any[]>();

      cart.items?.forEach((item: any) => {
        if (item.metadata?.is_from_bundle && item.metadata?.bundle_id) {
          const bundleId = item.metadata.bundle_id;

          // If specific bundle requested, only process that one
          if (specific_bundle_id && bundleId !== specific_bundle_id) {
            return;
          }

          if (!bundleGroups.has(bundleId)) {
            bundleGroups.set(bundleId, []);
          }
          bundleGroups.get(bundleId)!.push(item);
        }
      });

      console.log(`📊 Processing ${bundleGroups.size} bundle(s)`);

      // Process each bundle
      for (const [bundleId, bundleItems] of bundleGroups) {
        const bundleResult = await processBundleRecalculation(
          bundleId,
          bundleItems,
          query,
          cartModuleService
        );

        if (bundleResult) {
          results.push(bundleResult);
        }
      }

      console.log(`✅ Recalculated discounts for ${results.length} bundles`);

      return new StepResponse(results);
    } catch (error) {
      console.error("❌ Error in recalculate bundle discounts step:", error);
      throw error;
    }
  }
);

async function processBundleRecalculation(
  bundleId: string,
  bundleItems: any[],
  query: any,
  cartModuleService: any
) {
  try {
    console.log(
      `🔍 Recalculating bundle ${bundleId} with ${bundleItems.length} items`
    );

    // Get fresh bundle configuration
    const { data: bundles } = await query.graph({
      entity: "bundle",
      fields: [
        "id",
        "title",
        "discount_type",
        "discount_2_items",
        "discount_3_items",
        "discount_2_items_amount",
        "discount_3_items_amount",
        "is_active",
      ],
      filters: {
        id: bundleId,
      },
    });

    const bundle = bundles?.[0];
    if (!bundle) {
      console.log(`⚠️ Bundle ${bundleId} not found`);
      return null;
    }

    if (!bundle.is_active) {
      console.log(`⚠️ Bundle ${bundleId} is inactive - removing discounts`);
      await resetToOriginalPrices(bundleItems, cartModuleService);
      return {
        bundleId,
        action: "reset_inactive",
        itemsProcessed: bundleItems.length,
      };
    }

    // Calculate total items in this bundle
    const totalItems = bundleItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Determine applicable discount
    const discountInfo = getApplicableDiscount(totalItems, bundle);

    if (!discountInfo.applicable) {
      console.log(
        `❌ No discount for ${totalItems} items - resetting to original prices`
      );
      await resetToOriginalPrices(bundleItems, cartModuleService);
      return {
        bundleId,
        action: "reset_no_discount",
        itemsProcessed: bundleItems.length,
      };
    }

    console.log(`💰 Applying ${discountInfo.type} discount:`, discountInfo);

    // Apply the appropriate discount
    if (discountInfo.type === "percentage") {
      await applyPercentageDiscountToBundleItems(
        bundleItems,
        discountInfo.rate!,
        cartModuleService
      );
    } else if (discountInfo.type === "fixed") {
      await applyFixedDiscountToBundleItems(
        bundleItems,
        discountInfo.amount!,
        cartModuleService
      );
    }

    return {
      bundleId,
      action: "discount_applied",
      discountType: discountInfo.type,
      itemsProcessed: bundleItems.length,
      totalItems,
      discount: discountInfo,
    };
  } catch (error) {
    console.error(`❌ Error processing bundle ${bundleId}:`, error);
    return null;
  }
}

function getApplicableDiscount(itemCount: number, bundle: any) {
  // Check fixed discounts first
  if (
    bundle.discount_type === "fixed" ||
    bundle.discount_2_items_amount ||
    bundle.discount_3_items_amount
  ) {
    let amount = 0;

    if (itemCount === 2 && bundle.discount_2_items_amount) {
      amount = bundle.discount_2_items_amount;
    } else if (itemCount >= 3 && bundle.discount_3_items_amount) {
      amount = bundle.discount_3_items_amount;
    }

    if (amount > 0) {
      return {
        applicable: true,
        type: "fixed",
        amount: amount, // in cents
      };
    }
  }

  // Check percentage discounts
  if (
    bundle.discount_type === "percentage" ||
    bundle.discount_2_items ||
    bundle.discount_3_items
  ) {
    let percentage = 0;

    if (itemCount === 2 && bundle.discount_2_items) {
      percentage = bundle.discount_2_items;
    } else if (itemCount >= 3 && bundle.discount_3_items) {
      percentage = bundle.discount_3_items;
    }

    if (percentage > 0) {
      return {
        applicable: true,
        type: "percentage",
        rate: percentage / 100,
        percentage: percentage,
      };
    }
  }

  return { applicable: false, type: "none" };
}

async function resetToOriginalPrices(
  bundleItems: any[],
  cartModuleService: any
) {
  const updatePromises = bundleItems.map(async (item) => {
    // Get original price from variant or metadata
    let originalPrice = 0;

    if (item.metadata?.original_price_cents) {
      originalPrice = item.metadata.original_price_cents;
    } else if (item.variant?.prices?.[0]?.amount) {
      originalPrice = item.variant.prices[0].amount;
    }

    if (originalPrice > 0 && originalPrice !== item.unit_price) {
      return cartModuleService.updateLineItems([
        {
          id: item.id,
          unit_price: originalPrice,
          metadata: {
            ...item.metadata,
            discount_applied: false,
            discount_reset_at: new Date().toISOString(),
          },
        },
      ]);
    }

    return null;
  });

  const results = await Promise.all(updatePromises);
  const updated = results.filter(Boolean).length;

  console.log(`🔄 Reset ${updated} items to original prices`);
  return updated;
}

async function applyPercentageDiscountToBundleItems(
  bundleItems: any[],
  discountRate: number,
  cartModuleService: any
) {
  const updatePromises = bundleItems.map(async (item) => {
    let originalPrice = 0;

    if (item.variant?.prices?.[0]?.amount) {
      originalPrice = item.variant.prices[0].amount;
    }

    if (originalPrice === 0) {
      console.warn(`No price found for item ${item.id}`);
      return null;
    }

    const discountedPrice = Math.round(originalPrice * (1 - discountRate));

    return cartModuleService.updateLineItems([
      {
        id: item.id,
        unit_price: discountedPrice,
        metadata: {
          ...item.metadata,
          original_price_cents: originalPrice,
          discounted_price_cents: discountedPrice,
          discount_applied: true,
          discount_rate: discountRate,
          discount_recalculated_at: new Date().toISOString(),
        },
      },
    ]);
  });

  const results = await Promise.all(updatePromises);
  const updated = results.filter(Boolean).length;

  console.log(`💰 Applied ${discountRate * 100}% discount to ${updated} items`);
  return updated;
}

async function applyFixedDiscountToBundleItems(
  bundleItems: any[],
  totalDiscountAmount: number,
  cartModuleService: any
) {
  // Calculate bundle total for proportional distribution
  const bundleTotal = bundleItems.reduce((sum, item) => {
    const originalPrice = item.variant?.prices?.[0]?.amount || 0;
    return sum + originalPrice * item.quantity;
  }, 0);

  if (bundleTotal === 0) {
    console.warn("Bundle total is 0, cannot apply fixed discount");
    return 0;
  }

  // Distribute discount proportionally across items
  let remainingDiscount = totalDiscountAmount;

  const updatePromises = bundleItems.map(async (item, index) => {
    const originalPrice = item.variant?.prices?.[0]?.amount || 0;
    const itemTotal = originalPrice * item.quantity;
    const itemProportion = itemTotal / bundleTotal;

    // Calculate this item's discount share
    let itemDiscountAmount: number;
    if (index === bundleItems.length - 1) {
      // Last item gets the remainder to avoid rounding errors
      itemDiscountAmount = remainingDiscount;
    } else {
      itemDiscountAmount = Math.round(totalDiscountAmount * itemProportion);
      remainingDiscount -= itemDiscountAmount;
    }

    const discountPerUnit = Math.round(itemDiscountAmount / item.quantity);
    const newUnitPrice = Math.max(0, originalPrice - discountPerUnit);

    return cartModuleService.updateLineItems([
      {
        id: item.id,
        unit_price: newUnitPrice,
        metadata: {
          ...item.metadata,
          original_price_cents: originalPrice,
          discounted_price_cents: newUnitPrice,
          discount_applied: true,
          fixed_discount_amount: itemDiscountAmount,
          discount_recalculated_at: new Date().toISOString(),
        },
      },
    ]);
  });

  const results = await Promise.all(updatePromises);
  const updated = results.filter(Boolean).length;

  console.log(
    `💰 Applied RM${(totalDiscountAmount / 100).toFixed(2)} fixed discount to ${updated} items`
  );
  return updated;
}
