// src/workflows/steps/prepare-bundle-cart-data.ts - FIXED VERSION
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

export type PrepareFlexibleBundleCartDataStepInput = {
  bundle: any;
  cart: any;
  selectedItems: {
    item_id: string;
    variant_id: string;
    quantity?: number;
  }[];
};

export const prepareFlexibleBundleCartDataStep = createStep(
  "prepare-flexible-bundle-cart-data",
  async ({
    bundle,
    cart,
    selectedItems,
  }: PrepareFlexibleBundleCartDataStepInput) => {
    console.log(
      "Processing flexible bundle with",
      selectedItems.length,
      "items"
    );
    console.log(
      "Cart currency:",
      cart.currency_code,
      "Region:",
      cart.region_id
    );

    // Get discount rate based on number of selected items
    const getDiscountRate = (itemCount: number, bundle: any) => {
      if (itemCount === 2 && bundle.discount_2_items) {
        return Number(bundle.discount_2_items) / 100;
      }
      if (itemCount >= 3 && bundle.discount_3_items) {
        return Number(bundle.discount_3_items) / 100;
      }
      return 0; // No discount
    };

    const discountRate = getDiscountRate(selectedItems.length, bundle);
    console.log(
      `Applying ${discountRate * 100}% discount for ${selectedItems.length} items`
    );

    // Map selected items to cart items
    const cartItems = selectedItems.map((selectedItem) => {
      const bundleItem = bundle.items.find(
        (item) => item.id === selectedItem.item_id
      );
      if (!bundleItem) {
        throw new Error(`Bundle item not found: ${selectedItem.item_id}`);
      }

      const quantity = selectedItem.quantity || bundleItem.quantity;

      console.log(
        `Adding item: ${bundleItem.product_id}, variant: ${selectedItem.variant_id}, qty: ${quantity}`
      );

      return {
        variant_id: selectedItem.variant_id,
        quantity: quantity,
        // REMOVED: unit_price (let Medusa handle pricing)
        metadata: {
          bundle_id: bundle.id,
          bundle_item_id: bundleItem.id,
          bundle_discount_rate: discountRate,
          bundle_discount_percentage: discountRate * 100,
          is_from_bundle: true,
          is_bundle_item: true,
          bundle_title: bundle.title,
          cart_currency: cart.currency_code,
          cart_region: cart.region_id,
        },
      };
    });

    console.log(`Prepared ${cartItems.length} flexible bundle items`);
    return new StepResponse(cartItems);
  }
);
