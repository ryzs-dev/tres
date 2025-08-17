// src/subscribers/cart-item-created.ts - TOTAL CART DISCOUNT VERSION
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

export default async function cartItemCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log("🚀 BUNDLE DISCOUNT SUBSCRIBER TRIGGERED!");
  console.log("📦 Cart ID:", data.id);

  const query = container.resolve("query");

  try {
    // Get all cart items in the cart
    const { data: cartData } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "items.*",
        "items.metadata",
        "items.variant.*",
        "items.variant.prices.*",
      ],
      filters: { id: data.id },
    });

    const cart = cartData[0];
    if (!cart || !cart.items || cart.items.length === 0) {
      console.log("⏭️  No cart or items found, skipping");
      return;
    }

    console.log(`📦 Found cart with ${cart.items.length} items`);

    // Group bundle items by bundle_id
    const bundleGroups = cart.items
      .filter((item) => item?.metadata?.is_from_bundle === true)
      .reduce(
        (groups, item) => {
          const bundleId = item?.metadata?.bundle_id as string;
          if (!bundleId) return groups;

          if (!groups[bundleId]) {
            groups[bundleId] = [];
          }
          groups[bundleId].push(item);
          return groups;
        },
        {} as Record<string, any[]>
      );

    if (Object.keys(bundleGroups).length === 0) {
      console.log("⏭️  No bundle items found, skipping");
      return;
    }

    const cartModuleService = container.resolve("cart");

    // Process each bundle group
    for (const [bundleId, bundleItems] of Object.entries(bundleGroups)) {
      console.log(
        `\n🎯 Processing bundle ${bundleId} with ${bundleItems.length} items`
      );

      // Check if this bundle already has discount applied
      const alreadyProcessed = bundleItems.some(
        (item) => item.metadata?.discount_applied
      );
      if (alreadyProcessed) {
        console.log(
          `✅ Bundle ${bundleId} already has discount applied, skipping`
        );
        continue;
      }

      // Get discount configuration from first item (all items in bundle have same config)
      const firstItem = bundleItems[0];
      const discountType = firstItem.metadata.bundle_discount_type;
      const discountRate = firstItem.metadata.bundle_discount_rate;
      const fixedDiscountAmount = firstItem.metadata.fixed_discount_amount;
      const itemCount = bundleItems.length;

      console.log("🎯 Bundle discount configuration:", {
        bundleId,
        itemCount,
        discountType,
        discountRate,
        fixedDiscountAmount,
      });

      // Skip if no discount to apply
      if (discountType === "none" || (!discountRate && !fixedDiscountAmount)) {
        console.log("❌ No discount to apply for this bundle");
        continue;
      }

      // Calculate total bundle value and total discount
      const bundleTotal = bundleItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );
      let totalDiscountAmount = 0;

      // Handle Fixed Discount - TOTAL discount for the entire bundle
      if (discountType === "fixed" && fixedDiscountAmount > 0) {
        // fixedDiscountAmount is total discount for the bundle in cents
        totalDiscountAmount = fixedDiscountAmount / 100; // Convert to RM

        console.log("💰 APPLYING FIXED DISCOUNT TO BUNDLE:");
        console.log(`   Bundle Total: ${bundleTotal} RM`);
        console.log(`   Total Fixed Discount: ${totalDiscountAmount} RM`);
      }
      // Handle Percentage Discount
      else if (
        (discountType === "percentage" || !discountType) &&
        discountRate > 0
      ) {
        totalDiscountAmount = bundleTotal * discountRate;

        console.log("💰 APPLYING PERCENTAGE DISCOUNT TO BUNDLE:");
        console.log(`   Bundle Total: ${bundleTotal} RM`);
        console.log(`   Discount Rate: ${discountRate * 100}%`);
        console.log(`   Total Discount: ${totalDiscountAmount} RM`);
      }

      if (totalDiscountAmount <= 0) {
        console.log("❌ No valid discount amount calculated");
        continue;
      }

      // Distribute the total discount proportionally across all items in the bundle
      let remainingDiscount = totalDiscountAmount;
      const itemUpdates = [];

      for (let i = 0; i < bundleItems.length; i++) {
        const item = bundleItems[i];
        const itemTotal = item.unit_price * item.quantity;
        const itemProportion = itemTotal / bundleTotal;

        // Calculate this item's share of the discount
        let itemDiscountAmount;
        if (i === bundleItems.length - 1) {
          // Last item gets the remainder to avoid rounding errors
          itemDiscountAmount = remainingDiscount;
        } else {
          itemDiscountAmount =
            Math.round(totalDiscountAmount * itemProportion * 100) / 100;
          remainingDiscount -= itemDiscountAmount;
        }

        const originalUnitPrice = item.unit_price;
        const discountPerUnit = itemDiscountAmount / item.quantity;
        const newUnitPrice = Math.max(0, originalUnitPrice - discountPerUnit);

        console.log(
          `   Item ${item.id}: ${originalUnitPrice} RM → ${newUnitPrice} RM (discount: ${discountPerUnit} RM per unit)`
        );

        // @ts-ignore
        itemUpdates.push({
          id: item.id,
          unit_price: newUnitPrice,
          metadata: {
            ...item.metadata,
            // Store pricing info in cents for consistency
            original_price_cents: Math.round(originalUnitPrice * 100),
            discounted_price_cents: Math.round(newUnitPrice * 100),
            actual_discount_amount: Math.round(itemDiscountAmount * 100), // Total discount for this item
            bundle_total_discount: Math.round(totalDiscountAmount * 100), // Total bundle discount
            discount_applied: true,
            discount_applied_at: new Date().toISOString(),
          },
        });
      }

      // Apply all updates
      try {
        await cartModuleService.updateLineItems(itemUpdates);

        console.log("✅ BUNDLE DISCOUNT APPLIED SUCCESSFULLY!");
        console.log(
          `   Bundle ${bundleId}: Total discount ${totalDiscountAmount} RM distributed across ${bundleItems.length} items`
        );
      } catch (updateError) {
        console.error(`❌ Failed to update bundle ${bundleId}:`, updateError);
      }
    }

    console.log("🎉 Bundle discount processing completed!");
  } catch (error) {
    console.error("❌ Error in bundle discount subscriber:", error);
  }
}

export const config: SubscriberConfig = {
  event: "cart.updated", // This event triggers when cart is modified
};
