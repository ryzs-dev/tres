import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { getDiscountInfo } from "../../utils/getDiscountInfo";
import { applyDiscount } from "../../utils/applyDiscount";

type PrepareFlexibleBundleCartDataStepInput = {
  bundle: any;
  cart: any;
  selectedItems: {
    item_id: string;
    variant_id: string;
    quantity?: number;
  }[];
  productVariants: any[];
};

export const prepareFlexibleBundleCartDataStep = createStep(
  "prepare-flexible-bundle-cart-data",
  async ({
    bundle,
    cart,
    selectedItems,
    productVariants,
  }: PrepareFlexibleBundleCartDataStepInput) => {
    const totalItems = selectedItems.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );

    // Calculate discount info based on total items (e.g. RM20 off for 2 items)
    const discountInfo = getDiscountInfo(totalItems, bundle);

    // 1️⃣ Collect variant info and original prices
    const itemsWithPrice = selectedItems.map((selectedItem) => {
      const variant = productVariants.find(
        (v) => v.id === selectedItem.variant_id
      );
      if (!variant)
        throw new Error(`Variant not found: ${selectedItem.variant_id}`);

      const priceMYR = variant.prices.find(
        (p) => p.currency_code.toLowerCase() === "myr"
      );
      if (!priceMYR) throw new Error(`No MYR price found for ${variant.id}`);

      const basePrice = priceMYR.amount; // convert to cents

      return {
        variant_id: variant.id,
        item_id: selectedItem.item_id,
        quantity: selectedItem.quantity || 1,
        unitPrice: basePrice, // current price in cents
        originalPrice: basePrice, // keep the original price before discount
        sku: variant.sku,
        product_title: variant.product.title,
      };
    });

    // 2️⃣ Apply total bundle discount across items
    const discountedItems = applyDiscount(
      itemsWithPrice,
      discountInfo.fixedDiscountAmount / 100
    );

    // 3️⃣ Map back to Medusa-compatible cart items
    const cartItems = discountedItems.map((item) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unitPrice, // discounted unit price (still in cents)
      compare_at_unit_price: item.originalPrice, // keep as integer cents
      raw_compare_at_unit_price: item.originalPrice,
      metadata: {
        bundle_id: bundle.id,
        bundle_title: bundle.title,
        bundle_item_id: item.item_id,
        variant_sku: item.sku,
        product_title: item.product_title,
        discount_applied: discountInfo.fixedDiscountAmount, // in cents
      },
    }));

    return new StepResponse(cartItems);
  }
);
