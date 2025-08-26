// src/workflows/steps/prepare-bundle-cart-data.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

type PrepareFlexibleBundleCartDataStepInput = {
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
    console.log("💰 Cart currency:", cart.currency_code);
    console.log("🎯 Bundle discount configuration:", {
      discount_type: bundle.discount_type,
      discount_2_items: bundle.discount_2_items,
      discount_3_items: bundle.discount_3_items,
      discount_2_items_amount: bundle.discount_2_items_amount,
      discount_3_items_amount: bundle.discount_3_items_amount,
    });

    // Enhanced function to get discount info (supports both fixed and percentage)
    const getDiscountInfo = (itemCount: number, bundle: any) => {
      console.log(`🔍 Getting discount for ${itemCount} items`);

      // Priority 1: Fixed discount amounts (new system)
      if (
        bundle.discount_type === "fixed" ||
        bundle.discount_2_items_amount ||
        bundle.discount_3_items_amount
      ) {
        let fixedDiscountAmount = 0; // in cents

        if (itemCount === 2 && bundle.discount_2_items_amount) {
          fixedDiscountAmount = bundle.discount_2_items_amount;
        } else if (itemCount >= 3 && bundle.discount_3_items_amount) {
          fixedDiscountAmount = bundle.discount_3_items_amount;
        }

        if (fixedDiscountAmount > 0) {
          console.log(
            `💰 Using FIXED discount: ${fixedDiscountAmount} cents for ${itemCount} items`
          );
          return {
            type: "fixed",
            fixedDiscountAmount, // in cents
            discountRate: 0, // not applicable for fixed
            discountPercentage: 0, // not applicable for fixed
          };
        }
      }

      // Priority 2: Percentage discounts (backward compatibility)
      let rate = 0;
      if (itemCount === 2 && bundle.discount_2_items) {
        rate = Number(bundle.discount_2_items) / 100;
      } else if (itemCount >= 3 && bundle.discount_3_items) {
        rate = Number(bundle.discount_3_items) / 100;
      }

      if (rate > 0) {
        console.log(
          `💰 Using PERCENTAGE discount: ${rate * 100}% for ${itemCount} items`
        );
        return {
          type: "percentage",
          fixedDiscountAmount: 0, // not applicable for percentage
          discountRate: Math.round(rate * 10000) / 10000, // Round to avoid floating point issues
          discountPercentage: Math.round(rate * 100),
        };
      }

      console.log(`❌ No discount available for ${itemCount} items`);
      return {
        type: "none",
        fixedDiscountAmount: 0,
        discountRate: 0,
        discountPercentage: 0,
      };
    };

    const discountInfo = getDiscountInfo(selectedItems.length, bundle);

    // Map selected items to cart items with enhanced metadata
    const cartItems = selectedItems.map((selectedItem) => {
      const bundleItem = bundle.items.find(
        (item) => item.id === selectedItem.item_id
      );
      if (!bundleItem) {
        throw new Error(`Bundle item not found: ${selectedItem.item_id}`);
      }

      const quantity = selectedItem.quantity || bundleItem.quantity || 1;

      console.log(bundleItem);
      console.log(selectedItem);
      console.log(
        `➕ Adding: ${bundleItem.product_title || "Unknown Product"}, variant: ${selectedItem.variant_id}, qty: ${quantity}`
      );

      // Enhanced metadata with fixed discount support
      const metadata = {
        // Bundle identification
        bundle_id: bundle.id,
        bundle_item_id: bundleItem.id,
        bundle_title: bundle.title,

        // Discount information for subscriber (both types)
        bundle_discount_type: discountInfo.type,
        bundle_discount_rate: discountInfo.discountRate,
        bundle_discount_percentage: discountInfo.discountPercentage,
        fixed_discount_amount: discountInfo.fixedDiscountAmount, // in cents

        // Bundle flags
        is_from_bundle: true,
        is_bundle_item: true,

        // Cart context
        cart_currency: cart.currency_code,
        cart_region: cart.region_id,

        // Debug info
        created_at: new Date().toISOString(),
        items_in_bundle: selectedItems.length,
      };

      console.log(`📝 Item metadata:`, metadata);

      return {
        variant_id: selectedItem.variant_id,
        quantity: quantity,
        // NO unit_price - let subscriber handle the pricing after item is created
        metadata,
      };
    });

    if (discountInfo.type === "fixed") {
      console.log(
        `✅ Prepared ${cartItems.length} bundle items with FIXED discount of ${discountInfo.fixedDiscountAmount} cents`
      );
    } else if (discountInfo.type === "percentage") {
      console.log(
        `✅ Prepared ${cartItems.length} bundle items with ${discountInfo.discountPercentage}% discount`
      );
    } else {
      console.log(
        `✅ Prepared ${cartItems.length} bundle items with NO discount`
      );
    }

    return new StepResponse(cartItems);
  }
);
