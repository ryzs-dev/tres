// import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
// import { container } from "@medusajs/framework";

// export default async function cartUpdatedHandler({
//   event,
//   container,
// }: SubscriberArgs<{ id: string }>) {
//   const cartId = event.data.id;

//   if (!cartId) {
//     console.log("⚠️ No cart ID found in cart updated event");
//     return;
//   }

//   console.log(`🔄 Cart ${cartId} updated - checking bundle discounts...`);

//   try {
//     const query = container.resolve("query");
//     const cartModuleService = container.resolve("cart");

//     // Get all cart items with bundle metadata
//     const { data: allCartItems } = await query.graph({
//       entity: "cart_item",
//       fields: ["*", "metadata", "variant.*", "variant.prices.*"],
//       filters: {
//         cart_id: cartId,
//       },
//     });

//     if (!allCartItems || allCartItems.length === 0) {
//       console.log("📦 No items in cart");
//       return;
//     }

//     // Group items by bundle_id
//     const bundleGroups = new Map<string, any[]>();
//     const nonBundleItems: any[] = [];

//     allCartItems.forEach((item) => {
//       if (item.metadata?.is_from_bundle && item.metadata?.bundle_id) {
//         const bundleId = item.metadata.bundle_id;
//         if (!bundleGroups.has(bundleId)) {
//           bundleGroups.set(bundleId, []);
//         }
//         bundleGroups.get(bundleId)!.push(item);
//       } else {
//         nonBundleItems.push(item);
//       }
//     });

//     console.log(`📊 Found ${bundleGroups.size} bundles to process`);

//     // Process each bundle
//     for (const [bundleId, bundleItems] of bundleGroups) {
//       await recalculateBundleDiscount(
//         bundleId,
//         bundleItems,
//         query,
//         cartModuleService
//       );
//     }

//     console.log("✅ Bundle discount recalculation completed");
//   } catch (error) {
//     console.error("❌ Error in cart updated handler:", error);
//   }
// }

// async function recalculateBundleDiscount(
//   bundleId: string,
//   bundleItems: any[],
//   query: any,
//   cartModuleService: any
// ) {
//   try {
//     console.log(
//       `🔍 Processing bundle ${bundleId} with ${bundleItems.length} items`
//     );

//     // Get bundle configuration
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
//       filters: {
//         id: bundleId,
//         is_active: true,
//       },
//     });

//     const bundle = bundles?.[0];
//     if (!bundle) {
//       console.log(`⚠️ Bundle ${bundleId} not found or inactive`);
//       return;
//     }

//     // Calculate current total items in bundle
//     const totalBundleItems = bundleItems.reduce(
//       (sum, item) => sum + item.quantity,
//       0
//     );

//     // Get discount info based on current item count
//     const discountInfo = calculateDiscountForItems(totalBundleItems, bundle);

//     if (!discountInfo.hasDiscount) {
//       console.log(`❌ No discount applicable for ${totalBundleItems} items`);
//       // Reset items to original prices
//       await resetBundleItemsToOriginalPrice(bundleItems, cartModuleService);
//       return;
//     }

//     console.log(`💰 Applying ${discountInfo.type} discount:`, discountInfo);

//     // Apply discount based on type
//     if (discountInfo.type === "percentage") {
//       if (typeof discountInfo.rate === "number") {
//         await applyPercentageDiscount(
//           bundleItems,
//           discountInfo.rate,
//           cartModuleService
//         );
//       } else {
//         console.warn(
//           "❌ Discount rate is undefined, skipping percentage discount application"
//         );
//       }
//     } else if (discountInfo.type === "fixed") {
//       if (typeof discountInfo.amount === "number") {
//         await applyFixedDiscount(
//           bundleItems,
//           discountInfo.amount,
//           cartModuleService
//         );
//       } else {
//         console.warn(
//           "❌ Discount amount is undefined, skipping fixed discount application"
//         );
//       }
//     }

//     console.log(`✅ Bundle ${bundleId} discounts recalculated successfully`);
//   } catch (error) {
//     console.error(`❌ Error processing bundle ${bundleId}:`, error);
//   }
// }

// function calculateDiscountForItems(itemCount: number, bundle: any) {
//   // Check for fixed discount first
//   if (
//     bundle.discount_type === "fixed" ||
//     bundle.discount_2_items_amount ||
//     bundle.discount_3_items_amount
//   ) {
//     let discountAmount = 0;

//     if (itemCount === 2 && bundle.discount_2_items_amount) {
//       discountAmount = bundle.discount_2_items_amount;
//     } else if (itemCount >= 3 && bundle.discount_3_items_amount) {
//       discountAmount = bundle.discount_3_items_amount;
//     }

//     if (discountAmount > 0) {
//       return {
//         hasDiscount: true,
//         type: "fixed",
//         amount: discountAmount, // in cents
//         displayText: `RM${(discountAmount / 100).toFixed(2)} off`,
//       };
//     }
//   }

//   // Check for percentage discount
//   if (
//     bundle.discount_type === "percentage" ||
//     bundle.discount_2_items ||
//     bundle.discount_3_items
//   ) {
//     let discountPercentage = 0;

//     if (itemCount === 2 && bundle.discount_2_items) {
//       discountPercentage = bundle.discount_2_items;
//     } else if (itemCount >= 3 && bundle.discount_3_items) {
//       discountPercentage = bundle.discount_3_items;
//     }

//     if (discountPercentage > 0) {
//       return {
//         hasDiscount: true,
//         type: "percentage",
//         rate: discountPercentage / 100,
//         displayText: `${discountPercentage}% off`,
//       };
//     }
//   }

//   return { hasDiscount: false, type: "none" };
// }

// async function resetBundleItemsToOriginalPrice(
//   bundleItems: any[],
//   cartModuleService: any
// ) {
//   const updatePromises = bundleItems.map(async (item) => {
//     // Get original price from variant or stored metadata
//     let originalPrice = 0;

//     if (item.metadata?.original_price_cents) {
//       originalPrice = item.metadata.original_price_cents;
//     } else if (item.variant?.prices?.length > 0) {
//       originalPrice = item.variant.prices[0].amount;
//     }

//     if (originalPrice > 0) {
//       return cartModuleService.updateLineItems([
//         {
//           id: item.id,
//           unit_price: originalPrice,
//           metadata: {
//             ...item.metadata,
//             discount_applied: false,
//             discount_reset_at: new Date().toISOString(),
//           },
//         },
//       ]);
//     }
//   });

//   await Promise.all(updatePromises.filter(Boolean));
//   console.log(`🔄 Reset ${bundleItems.length} items to original prices`);
// }

// async function applyPercentageDiscount(
//   bundleItems: any[],
//   discountRate: number,
//   cartModuleService: any
// ) {
//   const updatePromises = bundleItems.map(async (item) => {
//     let originalPrice = 0;

//     // Get original price
//     if (item.variant?.prices?.length > 0) {
//       originalPrice = item.variant.prices[0].amount;
//     }

//     if (originalPrice === 0) {
//       console.warn(`No price found for item ${item.id}`);
//       return null;
//     }

//     const discountedPrice = Math.round(originalPrice * (1 - discountRate));

//     return cartModuleService.updateLineItems([
//       {
//         id: item.id,
//         unit_price: discountedPrice,
//         metadata: {
//           ...item.metadata,
//           original_price_cents: originalPrice,
//           discounted_price_cents: discountedPrice,
//           discount_applied: true,
//           discount_rate: discountRate,
//           discount_recalculated_at: new Date().toISOString(),
//         },
//       },
//     ]);
//   });

//   await Promise.all(updatePromises.filter(Boolean));
//   console.log(
//     `💰 Applied ${discountRate * 100}% discount to ${bundleItems.length} items`
//   );
// }

// async function applyFixedDiscount(
//   bundleItems: any[],
//   totalDiscountAmount: number,
//   cartModuleService: any
// ) {
//   // Calculate bundle total
//   const bundleTotal = bundleItems.reduce((sum, item) => {
//     const originalPrice = item.variant?.prices?.[0]?.amount || 0;
//     return sum + originalPrice * item.quantity;
//   }, 0);

//   if (bundleTotal === 0) {
//     console.warn("Bundle total is 0, cannot apply fixed discount");
//     return;
//   }

//   // Distribute discount proportionally
//   let remainingDiscount = totalDiscountAmount;
//   const updatePromises = bundleItems.map(async (item, index) => {
//     const originalPrice = item.variant?.prices?.[0]?.amount || 0;
//     const itemTotal = originalPrice * item.quantity;
//     const itemProportion = itemTotal / bundleTotal;

//     // Calculate this item's share of the discount
//     let itemDiscountAmount: number;
//     if (index === bundleItems.length - 1) {
//       // Last item gets the remainder
//       itemDiscountAmount = remainingDiscount;
//     } else {
//       itemDiscountAmount = Math.round(totalDiscountAmount * itemProportion);
//       remainingDiscount -= itemDiscountAmount;
//     }

//     const discountPerUnit = Math.round(itemDiscountAmount / item.quantity);
//     const newUnitPrice = Math.max(0, originalPrice - discountPerUnit);

//     return cartModuleService.updateLineItems([
//       {
//         id: item.id,
//         unit_price: newUnitPrice,
//         metadata: {
//           ...item.metadata,
//           original_price_cents: originalPrice,
//           discounted_price_cents: newUnitPrice,
//           discount_applied: true,
//           fixed_discount_amount: itemDiscountAmount,
//           discount_recalculated_at: new Date().toISOString(),
//         },
//       },
//     ]);
//   });

//   await Promise.all(updatePromises.filter(Boolean));
//   console.log(
//     `💰 Applied RM${(totalDiscountAmount / 100).toFixed(2)} fixed discount to ${bundleItems.length} items`
//   );
// }

// export const config: SubscriberConfig = {
//   event: [
//     "cart.updated", // When cart is modified
//     "cart-item.created", // When items are added
//     "cart-item.updated", // When quantities change
//     "cart-item.deleted", // When items are removed
//   ],
// };
