// src/workflows/add-flexible-bundle-to-cart.ts - FIXED VERSION
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  addToCartWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import {
  prepareFlexibleBundleCartDataStep,
  PrepareFlexibleBundleCartDataStepInput,
} from "./steps/prepare-bundle-cart-data";
import { container } from "@medusajs/framework";

type AddFlexibleBundleToCartWorkflowInput = {
  cart_id: string;
  bundle_id: string;
  selectedItems: {
    item_id: string;
    variant_id: string;
    quantity?: number;
  }[];
};

export const addFlexibleBundleToCartWorkflow = createWorkflow(
  "add-flexible-bundle-to-cart",
  ({
    cart_id,
    bundle_id,
    selectedItems,
  }: AddFlexibleBundleToCartWorkflowInput) => {
    // Get cart first with unique step name
    // @ts-ignore
    const { data: cartData } = useQueryGraphStep({
      entity: "cart",
      fields: ["id", "region_id", "currency_code", "region.*"],
      filters: {
        id: cart_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "get-cart-for-bundle" });

    // FIXED: Get bundle with basic data first
    // @ts-ignore
    const { data: bundles } = useQueryGraphStep({
      entity: "bundle",
      fields: [
        "id",
        "title",
        "min_items",
        "max_items",
        "selection_type",
        "is_active",
        "discount_2_items",
        "discount_3_items",
        "items.*",
      ],
      filters: {
        id: bundle_id,
        is_active: true,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "get-bundle-for-cart" });

    // FIXED: Get products separately for each bundle item
    // This ensures we have the product data that's missing
    // @ts-ignore
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "title", "handle", "variants.*", "variants.prices.*"],
    }).config({ name: "get-products-for-bundle" });

    // Prepare cart data with currency context
    //@ts-ignore
    const itemsToAdd = prepareFlexibleBundleCartDataStep({
      bundle: bundles[0],
      products: products || [], // Pass products separately
      cart: cartData[0],
      selectedItems,
    } as PrepareFlexibleBundleCartDataStepInput);

    // Add selected items to cart
    const addedCart = addToCartWorkflow.runAsStep({
      input: {
        cart_id,
        items: itemsToAdd,
      },
    });

    // Apply bundle discounts after items are added
    // @ts-ignore
    const { data: cartItems } = useQueryGraphStep({
      entity: "cart_item",
      fields: ["*", "metadata", "variant.*", "variant.prices.*"],
      filters: {
        cart_id: cart_id,
        metadata: { is_from_bundle: true },
      },
    }).config({ name: "get-bundle-cart-items" });

    // Apply discounts to bundle items
    const discountRate =
      bundles[0].discount_2_items && selectedItems.length === 2
        ? bundles[0].discount_2_items / 100
        : bundles[0].discount_3_items && selectedItems.length >= 3
          ? bundles[0].discount_3_items / 100
          : 0;

    if (discountRate > 0 && cartItems?.length > 0) {
      const cartModuleService = container.resolve("cart");

      const itemUpdates = cartItems.map((item) => {
        let originalPrice = 0;
        if (item.variant?.prices?.length > 0) {
          const price = item.variant.prices[0];
          originalPrice = price.amount; // In cents
        }

        const discountedPrice = Math.round(originalPrice * (1 - discountRate));

        return {
          id: item.id,
          unit_price: discountedPrice,
          metadata: {
            ...item.metadata,
            original_price_cents: originalPrice,
            discounted_price_cents: discountedPrice,
          },
        };
      });

      cartModuleService.updateCarts(itemUpdates);
      console.log(
        `Applied ${discountRate * 100}% discount to ${itemUpdates.length} items`
      );
    }

    // Fetch final updated cart
    // @ts-ignore
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
        "items.metadata",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
      ],
    }).config({ name: "refetch-final-cart" });

    return new WorkflowResponse(updatedCarts[0]); // Ensure synchronous return
  }
);
