// src/workflows/steps/prepare-bundle-cart-data.ts - METADATA FOCUSED VERSION
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
      "📦 Processing flexible bundle with",
      selectedItems.length,
      "items"
    );
    console.log(
      "💰 Cart currency:",
      cart.currency_code,
      "Region:",
      cart.region_id
    );

    // Get discount rate based on number of selected items
    const getDiscountRate = (itemCount: number, bundle: any) => {
      let rate = 0;
      
      if (itemCount === 2 && bundle.discount_2_items) {
        rate = Number(bundle.discount_2_items) / 100;
      } else if (itemCount >= 3 && bundle.discount_3_items) {
        rate = Number(bundle.discount_3_items) / 100;
      }
      
      // Round to avoid floating point precision issues
      return Math.round(rate * 10000) / 10000;
    };

    const discountRate = getDiscountRate(selectedItems.length, bundle);
    const discountPercentage = Math.round(discountRate * 100);
    
    console.log(
      `🎯 Discount: ${discountPercentage}% for ${selectedItems.length} items (rate: ${discountRate})`
    );

    // Map selected items to cart items with rich metadata
    const cartItems = selectedItems.map((selectedItem) => {
      const bundleItem = bundle.items.find(
        (item) => item.id === selectedItem.item_id
      );
      if (!bundleItem) {
        throw new Error(`Bundle item not found: ${selectedItem.item_id}`);
      }

      const quantity = selectedItem.quantity || bundleItem.quantity || 1;

      console.log(
        `➕ Adding: ${bundleItem.product?.title || 'Unknown Product'}, variant: ${selectedItem.variant_id}, qty: ${quantity}`
      );

      // DON'T set unit_price here - let Medusa use regular pricing, then subscriber will update
      return {
        variant_id: selectedItem.variant_id,
        quantity: quantity,
        // NO unit_price - let subscriber handle the pricing after item is created
        metadata: {
          // Bundle identification
          bundle_id: bundle.id,
          bundle_item_id: bundleItem.id,
          bundle_title: bundle.title,
          
          // Discount information for subscriber
          bundle_discount_rate: discountRate,
          bundle_discount_percentage: discountPercentage,
          
          // Bundle flags
          is_from_bundle: true,
          is_bundle_item: true,
          
          // Cart context
          cart_currency: cart.currency_code,
          cart_region: cart.region_id,
          
          // Debug info
          created_at: new Date().toISOString(),
          items_in_bundle: selectedItems.length,
        },
      };
    });

    console.log(`✅ Prepared ${cartItems.length} bundle items for cart`);
    console.log(`🎉 Subscriber will apply ${discountPercentage}% discount when items are added`);
    
    return new StepResponse(cartItems);
  }
);