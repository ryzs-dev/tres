// src/workflows/steps/prepare-bundle-cart-data.ts - FIXED VERSION
import { InferTypeOf, ProductDTO } from "@medusajs/framework/types";
import { Bundle } from "../../modules/bundled-product/models/bundle";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { BundleItem } from "../../modules/bundled-product/models/bundle-item";

type BundleItemWithProduct = InferTypeOf<typeof BundleItem> & {
  product: ProductDTO;
};

// FIXED: Add cart type for currency context
type CartData = {
  id: string;
  region_id: string;
  currency_code: string;
  region?: {
    currency_code: string;
  };
};

export type PrepareFlexibleBundleCartDataStepInput = {
  bundle: InferTypeOf<typeof Bundle> & {
    items: BundleItemWithProduct[];
  };
  cart: CartData; // FIXED: Add cart data
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
    // Simple hardcoded discount rates
    const DISCOUNT_RATES = {
      2: 0.1, // 10% off for 2 items
      3: 0.15, // 15% off for 3 items
    };

    const itemCount = selectedItems.length;
    const discountRate =
      DISCOUNT_RATES[itemCount as keyof typeof DISCOUNT_RATES] || 0;

    console.log(
      `Processing flexible bundle with ${itemCount} items, applying ${discountRate * 100}% discount`
    );
    console.log(
      `Cart currency: ${cart.currency_code}, Region: ${cart.region_id}`
    );

    // Process only selected items
    const cartItems = selectedItems.map((selectedItem) => {
      const bundleItem = bundle.items.find(
        (item) => item.id === selectedItem.item_id
      ) as BundleItemWithProduct;

      if (!bundleItem) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Bundle item ${selectedItem.item_id} not found in bundle ${bundle.id}`
        );
      }

      const variant = bundleItem.product.variants?.find(
        (v: any) => v.id === selectedItem.variant_id
      );

      if (!variant) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Variant ${selectedItem.variant_id} is invalid for product ${bundleItem.product.id}`
        );
      }

      // FIXED: Get original price with fallback approach
      let originalPrice = 0;

      // Try to get price from calculated_price first
      // @ts-ignore - ProductVariantDTO typing issue
      if (variant.calculated_price?.calculated_amount) {
        // @ts-ignore - ProductVariantDTO typing issue
        originalPrice = variant.calculated_price.calculated_amount;
      }
      // Fallback to prices array - get first available price
      // @ts-ignore - ProductVariantDTO typing issue
      else if (variant.prices && variant.prices.length > 0) {
        // @ts-ignore - ProductVariantDTO typing issue
        originalPrice = variant.prices[0].amount;
      }

      if (originalPrice === 0) {
        console.warn(
          `No price found for variant ${variant.id} in product ${bundleItem.product.title}`
        );
      }

      // Apply bundle discount
      const discountedPrice =
        discountRate > 0
          ? Math.round(originalPrice * (1 - discountRate))
          : originalPrice;

      // Use custom quantity if provided, otherwise use bundle item default
      const quantity = selectedItem.quantity || bundleItem.quantity;

      console.log(
        `Bundle Item: ${bundleItem.product.title} | ` +
          `Variant: ${(variant as any).title || variant.id} | ` +
          `Original: ${originalPrice} | ` +
          `Discounted: ${discountedPrice} | ` +
          `Discount: ${discountRate * 100}% | ` +
          `Qty: ${quantity}`
      );

      return {
        variant_id: selectedItem.variant_id,
        quantity: quantity,
        unit_price: discountedPrice, // Apply the bundle discount here
        metadata: {
          bundle_id: bundle.id,
          bundle_item_id: bundleItem.id,
          bundle_discount_rate: discountRate,
          original_price: originalPrice,
          discounted_price: discountedPrice,
          is_from_bundle: true,
          is_bundle_item: true, // For easy filtering
          bundle_title: bundle.title,
          bundle_discount_percentage: discountRate * 100,
          // FIXED: Add currency context to metadata
          cart_currency: cart.currency_code,
          cart_region: cart.region_id,
        },
      };
    });

    console.log(
      `Prepared ${cartItems.length} flexible bundle items with ${discountRate * 100}% discount`
    );

    return new StepResponse(cartItems);
  }
);
