import { InferTypeOf, ProductDTO } from "@medusajs/framework/types";
import { Bundle } from "../../modules/bundled-product/models/bundle";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { BundleItem } from "../../modules/bundled-product/models/bundle-item";

type BundleItemWithProduct = InferTypeOf<typeof BundleItem> & {
  product: ProductDTO & {
    variants: Array<{
      id: string;
      title: string;
      calculated_price?: {
        calculated_amount: number;
        currency_code: string;
      };
      prices?: Array<{
        amount: number;
        currency_code: string;
      }>;
    }>;
  };
};

export type PrepareFlexibleBundleCartDataStepInput = {
  bundle: InferTypeOf<typeof Bundle> & {
    items: BundleItemWithProduct[];
  };
  selectedItems: {
    item_id: string;
    variant_id: string;
    quantity?: number; // Allow custom quantity per item
  }[];
};

export const prepareFlexibleBundleCartDataStep = createStep(
  "prepare-flexible-bundle-cart-data",
  async ({ bundle, selectedItems }: PrepareFlexibleBundleCartDataStepInput) => {
    // Validate selection rules
    if (bundle.min_items && selectedItems.length < bundle.min_items) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `You must select at least ${bundle.min_items} items from this bundle`
      );
    }

    if (bundle.max_items && selectedItems.length > bundle.max_items) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `You can select at most ${bundle.max_items} items from this bundle`
      );
    }

    // Define bundle discount rates
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

      const variant = bundleItem.product.variants.find(
        (v) => v.id === selectedItem.variant_id
      );

      if (!variant) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Variant ${selectedItem.variant_id} is invalid for product ${bundleItem.product.id}`
        );
      }

      // Get original price from variant
      let originalPrice = 0;

      // Try to get price from calculated_price first
      if (variant.calculated_price?.calculated_amount) {
        originalPrice = variant.calculated_price.calculated_amount;
      }
      // Fallback to prices array - get first available price
      else if (variant.prices && variant.prices.length > 0) {
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
          `Variant: ${variant.title} | ` +
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
        },
      };
    });

    console.log(
      `Prepared ${cartItems.length} flexible bundle items with ${discountRate * 100}% discount`
    );

    return new StepResponse(cartItems);
  }
);
