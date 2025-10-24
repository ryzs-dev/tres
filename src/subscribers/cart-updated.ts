import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

interface CartItem {
  id: string;
  unit_price: number;
  quantity: number;
  metadata?: {
    is_from_bundle?: boolean;
    bundle_id?: string;
    original_price_cents?: number;
    discount_applied?: boolean;
    [key: string]: any;
  };
  variant?: {
    prices?: Array<{ amount: number }>;
  };
}

interface BundleDiscount {
  hasDiscount: boolean;
  type: "percentage" | "fixed" | "none";
  rate?: number;
  amount?: number;
}

export default async function cartUpdatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = event.data.id;

  if (!cartId) {
    console.log("⚠️ No cart ID found in cart updated event");
    return;
  }

  try {
    const query = container.resolve("query");
    const cartModuleService = container.resolve("cart");

    // Fetch cart with items
    const { data: cartData } = await query.graph({
      entity: "cart",
      fields: [
        "*",
        "id",
        "items.*",
        "items.metadata",
        "items.variant.*",
        "items.variant.prices.*",
      ],
      filters: { id: cartId },
    });

    // Handle response format variations
    const cart = Array.isArray(cartData) ? cartData[0] : cartData;

    // Group items by bundle
    // const bundleGroups = groupItemsByBundle(items);

    // if (bundleGroups.size === 0) {
    //   console.log("⏭️ No bundle items found, skipping");
    //   return;
    // }

    // Process each bundle
    // for (const [bundleId, bundleItems] of bundleGroups) {
    //   await processBundleDiscounts(
    //     bundleId,
    //     bundleItems,
    //     query,
    //     cartModuleService
    //   );
    // }
  } catch (error) {
    console.error("❌ Error in cart updated handler:", error);
  }
}

// function groupItemsByBundle(items: any[]): Map<string, CartItem[]> {
//   const bundleGroups = new Map<string, CartItem[]>();

//   items.forEach((item: any) => {
//     const { is_from_bundle, bundle_id } = item.metadata || {};

//     if (is_from_bundle === true && bundle_id) {
//       if (!bundleGroups.has(bundle_id)) {
//         bundleGroups.set(bundle_id, []);
//       }
//       bundleGroups.get(bundle_id)!.push(item);
//     }
//   });

//   return bundleGroups;
// }

// async function processBundleDiscounts(
//   bundleId: string,
//   bundleItems: CartItem[],
//   query: any,
//   cartModuleService: any
// ) {
//   try {
//     console.log(
//       `\n🎯 Processing bundle ${bundleId} (${bundleItems.length} items)`
//     );

//     // Calculate total items
//     const totalItems = bundleItems.reduce(
//       (sum, item) => sum + item.quantity,
//       0
//     );

//     // Fetch bundle configuration
//     const { data: bundles } = await query.graph({
//       entity: "bundle",
//       fields: [
//         "id",
//         "title",
//         "discount_type",
//         "discount_2_items",
//         "discount_3_items",
//         "discount_2_items_amount",
//         "discount_3_items_amount",
//       ],
//       filters: { id: bundleId, is_active: true },
//     });

//     const bundle = bundles?.[0];
//     if (!bundle) {
//       console.log(
//         `⚠️ Bundle ${bundleId} not found or inactive - resetting prices`
//       );
//       await resetToOriginalPrices(bundleItems, cartModuleService);
//       return;
//     }

//     // Calculate applicable discount
//     const discount = calculateDiscount(totalItems, bundle);

//     if (!discount.hasDiscount) {
//       console.log(`❌ No discount for ${totalItems} items - resetting prices`);
//       await resetToOriginalPrices(bundleItems, cartModuleService);
//       return;
//     }

//     // Apply discount
//     console.log(`💰 Applying ${discount.type} discount`);

//     if (discount.type === "percentage" && discount.rate) {
//       await applyPercentageDiscount(
//         bundleItems,
//         discount.rate,
//         cartModuleService
//       );
//     } else if (discount.type === "fixed" && discount.amount) {
//       await applyFixedDiscount(bundleItems, discount.amount, cartModuleService);
//     } else {
//       console.warn("❌ Invalid discount configuration");
//       await resetToOriginalPrices(bundleItems, cartModuleService);
//     }

//     console.log(`✅ Bundle ${bundleId} processed successfully`);
//   } catch (error) {
//     console.error(`❌ Error processing bundle ${bundleId}:`, error);
//   }
// }

// function calculateDiscount(itemCount: number, bundle: any): BundleDiscount {
//   // Check fixed discount
//   if (
//     bundle.discount_type === "fixed" ||
//     bundle.discount_2_items_amount ||
//     bundle.discount_3_items_amount
//   ) {
//     let amount = 0;
//     if (itemCount === 2 && bundle.discount_2_items_amount) {
//       amount = bundle.discount_2_items_amount;
//     } else if (itemCount >= 3 && bundle.discount_3_items_amount) {
//       amount = bundle.discount_3_items_amount;
//     }

//     if (amount > 0) {
//       return { hasDiscount: true, type: "fixed", amount };
//     }
//   }

//   // Check percentage discount
//   if (
//     bundle.discount_type === "percentage" ||
//     bundle.discount_2_items ||
//     bundle.discount_3_items
//   ) {
//     let percentage = 0;
//     if (itemCount === 2 && bundle.discount_2_items) {
//       percentage = bundle.discount_2_items;
//     } else if (itemCount >= 3 && bundle.discount_3_items) {
//       percentage = bundle.discount_3_items;
//     }

//     if (percentage > 0) {
//       return { hasDiscount: true, type: "percentage", rate: percentage / 100 };
//     }
//   }

//   return { hasDiscount: false, type: "none" };
// }

// async function resetToOriginalPrices(
//   bundleItems: CartItem[],
//   cartModuleService: any
// ) {
//   const updates = bundleItems
//     .map((item) => {
//       const originalPrice =
//         item.metadata?.original_price_cents ||
//         item.variant?.prices?.[0]?.amount ||
//         0;

//       if (originalPrice === 0) return null;

//       return {
//         id: item.id,
//         unit_price: originalPrice,
//         metadata: {
//           ...item.metadata,
//           discount_applied: false,
//           discount_reset_at: new Date().toISOString(),
//         },
//       };
//     })
//     .filter(Boolean);

//   await Promise.all(
//     updates.map((update) => cartModuleService.updateLineItems([update]))
//   );

//   console.log(`🔄 Reset ${updates.length} items to original prices`);
// }

// async function applyPercentageDiscount(
//   bundleItems: CartItem[],
//   discountRate: number,
//   cartModuleService: any
// ) {
//   const updates = bundleItems
//     .map((item) => {
//       const originalPrice = item.variant?.prices?.[0]?.amount || 0;

//       if (originalPrice === 0) {
//         console.warn(`No price for item ${item.id}`);
//         return null;
//       }

//       const discountedPrice = Math.round(originalPrice * (1 - discountRate));

//       return {
//         id: item.id,
//         unit_price: discountedPrice,
//         metadata: {
//           ...item.metadata,
//           original_price_cents: originalPrice,
//           discounted_price_cents: discountedPrice,
//           discount_applied: true,
//           discount_rate: discountRate,
//           discount_applied_at: new Date().toISOString(),
//         },
//       };
//     })
//     .filter(Boolean);

//   await Promise.all(
//     updates.map((update) => cartModuleService.updateLineItems([update]))
//   );

//   console.log(
//     `💰 Applied ${(discountRate * 100).toFixed(0)}% discount to ${updates.length} items`
//   );
// }

// async function applyFixedDiscount(
//   bundleItems: CartItem[],
//   totalDiscountAmount: number,
//   cartModuleService: any
// ) {
//   // Calculate bundle total
//   const bundleTotal = bundleItems.reduce((sum, item) => {
//     const price = item.variant?.prices?.[0]?.amount || 0;
//     return sum + price * item.quantity;
//   }, 0);

//   if (bundleTotal === 0) {
//     console.warn("Bundle total is 0, cannot apply discount");
//     return;
//   }

//   console.log(
//     `💰 Distributing RM${(totalDiscountAmount / 100).toFixed(2)} discount`
//   );

//   // Distribute discount proportionally
//   let remainingDiscount = totalDiscountAmount;
//   const updates: any[] = [];

//   bundleItems.forEach((item, index) => {
//     const originalPrice = item.variant?.prices?.[0]?.amount || 0;
//     const itemTotal = originalPrice * item.quantity;
//     const proportion = itemTotal / bundleTotal;

//     // Calculate item's share (last item gets remainder)
//     const itemDiscount =
//       index === bundleItems.length - 1
//         ? remainingDiscount
//         : Math.round(totalDiscountAmount * proportion);

//     remainingDiscount -= itemDiscount;

//     const discountPerUnit = Math.round(itemDiscount / item.quantity);
//     const newUnitPrice = Math.max(0, originalPrice - discountPerUnit);

//     updates.push({
//       id: item.id,
//       unit_price: newUnitPrice,
//       metadata: {
//         ...item.metadata,
//         original_price_cents: originalPrice,
//         discounted_price_cents: newUnitPrice,
//         discount_applied: true,
//         fixed_discount_amount: itemDiscount,
//         discount_applied_at: new Date().toISOString(),
//       },
//     });
//   });

//   await Promise.all(
//     updates.map((update) => cartModuleService.updateLineItems([update]))
//   );

//   console.log(`✅ Applied fixed discount to ${updates.length} items`);
// }

export const config: SubscriberConfig = {
  event: "cart.updated",
};
