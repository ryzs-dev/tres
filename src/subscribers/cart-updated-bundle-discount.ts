// src/subscribers/cart-updated-bundle-discount.ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

export default async function cartUpdatedBundleHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log("🚀 CART.UPDATED EVENT TRIGGERED!");
  console.log("📦 Cart ID:", data.id);
  
  const query = container.resolve("query");

  try {
    // Get all cart items to find any bundle items that need discount processing
    const { data: cartItems } = await query.graph({
      entity: "cart_item",
      fields: ["*", "metadata", "variant.*", "variant.prices.*"],
      filters: { 
        cart_id: data.id,
        metadata: { is_from_bundle: true }
      },
    });

    console.log(`🔍 Found ${cartItems?.length || 0} bundle items in cart`);

    if (!cartItems || cartItems.length === 0) {
      console.log("⏭️  No bundle items found, skipping");
      return;
    }

    // Group items by bundle to process discounts per bundle
    const bundleGroups = cartItems.reduce((groups, item) => {
      const bundleId = item.metadata?.bundle_id as string;
      if (!bundleId) return groups;
      
      if (!groups[bundleId]) {
        groups[bundleId] = [];
      }
      groups[bundleId].push(item);
      return groups;
    }, {} as Record<string, any[]>);

    console.log(`📊 Processing ${Object.keys(bundleGroups).length} bundle groups`);

    const cartModuleService = container.resolve("cart");

    // Process each bundle group
    for (const [bundleId, items] of Object.entries(bundleGroups) as [string, any[]][]) {
      console.log(`\n🎯 Processing bundle ${bundleId} with ${items.length} items`);
      
      // Check if any item in this bundle doesn't have discount applied yet
      const itemsNeedingDiscount = items.filter(item => 
        !item.metadata?.discount_applied && 
        item.metadata?.bundle_discount_rate > 0
      );

      if (itemsNeedingDiscount.length === 0) {
        console.log(`✅ Bundle ${bundleId} already has discounts applied`);
        continue;
      }

      console.log(`💰 Applying discounts to ${itemsNeedingDiscount.length} items in bundle ${bundleId}`);

      // Apply discounts to items that need them
      const itemUpdates = itemsNeedingDiscount
        .map(item => {
          const discountRate = item.metadata.bundle_discount_rate;
          
          // Get original price
          let originalPrice = 0;
          if (item.variant?.prices?.length > 0) {
            const cartCurrency = item.metadata.cart_currency || "MYR";
            const price = item.variant.prices.find(
              (p) => p.currency_code?.toLowerCase() === cartCurrency.toLowerCase()
            ) || item.variant.prices[0];
            originalPrice = price.amount;
          }

          if (originalPrice === 0) {
            console.warn(`⚠️  No price found for item ${item.id}`);
            return null;
          }

          const discountedPrice = Math.round(originalPrice * (1 - discountRate));

          console.log(`💵 Item ${item.id}: ${originalPrice} → ${discountedPrice} cents (${discountRate * 100}% off)`);

          return {
            id: item.id,
            unit_price: discountedPrice,
            metadata: {
              ...item.metadata,
              original_price_cents: originalPrice,
              discounted_price_cents: discountedPrice,
              discount_applied: true,
              discount_applied_at: new Date().toISOString(),
            },
          };
        })
        .filter((item): item is { id: any; unit_price: number; metadata: any } => item !== null);

      if (itemUpdates.length > 0) {
        console.log(`🔧 Updating ${itemUpdates.length} items...`);
        await cartModuleService.updateLineItems(itemUpdates);
        console.log(`✅ Applied discounts to bundle ${bundleId}`);
      }
    }

    console.log("🎉 Bundle discount processing completed!");

  } catch (error) {
    console.error("❌ Error in cart updated bundle handler:", error);
    // Don't throw - we don't want to break cart operations
  }
}

export const config: SubscriberConfig = {
  event: "cart.updated",
};