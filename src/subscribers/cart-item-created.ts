// src/subscribers/cart-item-created.ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

export default async function cartItemCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; cart_id: string }>) {
  const query = container.resolve("query");

  try {
    // Get the cart item with metadata
    const { data: cartItems } = await query.graph({
      entity: "cart_item",
      fields: ["*", "metadata", "variant.*", "variant.prices.*"],
      filters: { id: data.id },
    });

    const cartItem = cartItems[0];
    if (!cartItem || !cartItem.metadata?.is_from_bundle) {
      return; // Not a bundle item, skip
    }

    const discountRate = cartItem.metadata.bundle_discount_rate;
    if (!discountRate || discountRate === 0) {
      return; // No discount to apply
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

    // Calculate discounted price (in cents, precise)
    const discountedPrice = Math.round(originalPrice * (1 - discountRate));

    console.log(`Applying bundle discount to cart item ${cartItem.id}:`);
    console.log(`  Original: ${originalPrice} cents`);
    console.log(`  Discount: ${discountRate * 100}%`);
    console.log(`  Final: ${discountedPrice} cents`);

    // Update the cart item with the discounted price
    const cartModuleService = container.resolve("cart");

    await cartModuleService.updateCarts([
      {
        id: cartItem.id,
        metadata: {
          ...cartItem.metadata,
          original_price_cents: originalPrice,
          discounted_price_cents: discountedPrice,
        }, // Move price information into metadata
      },
    ]);

    console.log(`✅ Bundle discount applied to cart item ${cartItem.id}`);
  } catch (error) {
    console.error("Error applying bundle discount:", error);
  }
}

export const config: SubscriberConfig = {
  event: "cart.item_added",
};
