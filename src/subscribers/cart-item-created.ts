// src/subscribers/cart-item-created.ts - FIXED WITH CORRECT EVENT
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

export default async function cartItemCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; cart_id: string }>) {
  console.log("🚀 BUNDLE DISCOUNT SUBSCRIBER TRIGGERED!");
  console.log("📦 Event data:", data);
  
  const query = container.resolve("query");

  try {
    // Get the cart item with metadata
    const { data: cartItems } = await query.graph({
      entity: "cart_item",
      fields: ["*", "metadata", "variant.*", "variant.prices.*"],
      filters: { id: data.id },
    });

    const cartItem = cartItems[0];
    console.log("📦 Cart item found:", {
      id: cartItem?.id,
      unit_price: cartItem?.unit_price,
      metadata: cartItem?.metadata
    });
    
    if (!cartItem || !cartItem.metadata?.is_from_bundle) {
      console.log("⏭️  Not a bundle item, skipping");
      return;
    }

    console.log("✅ This IS a bundle item! Processing discount...");

    const discountRate = cartItem.metadata.bundle_discount_rate;
    if (!discountRate || discountRate === 0) {
      console.log("❌ No discount rate found:", discountRate);
      return;
    }

    // Get the original price from the variant
    let originalPrice = 0;
    if (cartItem.variant?.prices?.length > 0) {
      const cartCurrency = cartItem.metadata.cart_currency || "MYR";
      const price =
        cartItem.variant.prices.find(
          (p) => p.currency_code?.toLowerCase() === cartCurrency.toLowerCase()
        ) || cartItem.variant.prices[0];
      originalPrice = price.amount; // Keep in cents
    }

    if (originalPrice === 0) {
      console.log("❌ No price found for discount calculation");
      return;
    }

    // Calculate discounted price
    const discountedPrice = Math.round(originalPrice * (1 - discountRate));

    console.log("💰 APPLYING DISCOUNT:");
    console.log(`   Original: ${originalPrice} cents`);
    console.log(`   Rate: ${discountRate} (${discountRate * 100}%)`);
    console.log(`   Discounted: ${discountedPrice} cents`);

    // CRITICAL: Update the cart item with the actual discounted unit_price
    const cartModuleService = container.resolve("cart");

    await cartModuleService.updateLineItems([
      {
        id: cartItem.id,
        unit_price: discountedPrice, // This changes the actual price
        metadata: {
          ...cartItem.metadata,
          original_price_cents: originalPrice,
          discounted_price_cents: discountedPrice,
          discount_applied: true,
          discount_applied_at: new Date().toISOString(),
        },
      },
    ]);

    console.log("✅ DISCOUNT APPLIED SUCCESSFULLY!");
    console.log(`   Item ${cartItem.id}: ${originalPrice} → ${discountedPrice} cents`);
    
  } catch (error) {
    console.error("❌ Error in bundle discount subscriber:", error);
  }
}

export const config: SubscriberConfig = {
  event: "cart.updated", // Try this event name instead
};