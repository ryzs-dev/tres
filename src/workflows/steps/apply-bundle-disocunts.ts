import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { container } from "@medusajs/framework";

type ApplyBundleDiscountsInput = {
  cart_id: string;
  discount_rate: number;
  bundle_id: string;
};

export const applyBundleDiscountsStep = createStep(
  "apply-bundle-discounts",
  async ({ cart_id, discount_rate, bundle_id }: ApplyBundleDiscountsInput) => {
    if (discount_rate <= 0) {
      console.log("No discount to apply");
      return new StepResponse(null);
    }

    const query = container.resolve("query");
    const cartModuleService = container.resolve("cart");

    try {
      console.log(
        `🔄 Applying ${discount_rate * 100}% discount to bundle items in cart ${cart_id}`
      );

      // Get all bundle items in this cart
      const { data: cartItems } = await query.graph({
        entity: "cart_item",
        fields: ["*", "metadata", "variant.*", "variant.prices.*"],
        filters: {
          cart_id: cart_id,
          metadata: {
            is_from_bundle: true,
            bundle_id: bundle_id,
          },
        },
      });

      if (!cartItems || cartItems.length === 0) {
        console.log("No bundle items found to discount");
        return new StepResponse(null);
      }

      console.log(`Found ${cartItems.length} bundle items to discount`);

      // Process each item
      const updatePromises = cartItems.map(async (item) => {
        let originalPrice = 0;

        // Get original price from variant
        if (item.variant?.prices?.length > 0) {
          const price = item.variant.prices[0];
          originalPrice = price.amount; // In cents
        }

        if (originalPrice === 0) {
          console.warn(`No price found for item ${item.id}, skipping`);
          return null;
        }

        const discountedPrice = Math.round(originalPrice * (1 - discount_rate));

        console.log(
          `💰 Item ${item.id}: ${originalPrice} → ${discountedPrice} cents`
        );

        // Update the cart item
        try {
          await cartModuleService.updateLineItems([
            {
              id: item.id,
              unit_price: discountedPrice,
              metadata: {
                ...item.metadata,
                original_price_cents: originalPrice,
                discounted_price_cents: discountedPrice,
                discount_applied: true,
                discount_rate: discount_rate,
                discount_applied_at: new Date().toISOString(),
              },
            },
          ]);

          return {
            item_id: item.id,
            original_price: originalPrice,
            discounted_price: discountedPrice,
            discount_rate: discount_rate,
          };
        } catch (error) {
          console.error(`Failed to update item ${item.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(updatePromises);
      const successfulUpdates = results.filter(Boolean);

      console.log(
        `✅ Successfully applied discounts to ${successfulUpdates.length} items`
      );

      return new StepResponse(successfulUpdates);
    } catch (error) {
      console.error("Error in apply bundle discounts step:", error);
      throw error;
    }
  }
);
