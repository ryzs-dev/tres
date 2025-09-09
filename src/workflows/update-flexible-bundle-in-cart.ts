// src/workflows/update-flexible-bundle-in-cart.ts
import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  useQueryGraphStep,
  deleteLineItemsWorkflow,
  addToCartWorkflow,
} from "@medusajs/medusa/core-flows";
import { prepareFlexibleBundleCartDataStep } from "./steps/prepare-bundle-cart-data";

type UpdateFlexibleBundleInCartWorkflowInput = {
  cart_id: string;
  bundle_id: string;
  selectedItems: {
    item_id: string;
    variant_id: string;
    quantity?: number;
  }[];
};

export const updateFlexibleBundleInCartWorkflow = createWorkflow(
  "update-flexible-bundle-in-cart",
  (input: UpdateFlexibleBundleInCartWorkflowInput) => {
    const { cart_id, bundle_id, selectedItems } = input;

    // Step 1: Get current cart with items (same pattern as remove workflow)
    // @ts-ignore
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      fields: [
        "id",
        "region_id",
        "currency_code",
        "region.*",
        "items.*",
        "items.metadata",
      ],
      filters: {
        id: cart_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "get-cart-for-bundle-update" });

    // Step 2: Get bundle configuration (same pattern as add workflow)
    //@ts-ignore
    const bundleQuery = useQueryGraphStep({
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
        "discount_type",
        "discount_2_items_amount",
        "discount_3_items_amount",
        "items.*",
        "items.product.*",
        "items.product.variants.*",
        "items.product.variants.prices.*",
      ],
      filters: {
        id: bundle_id,
        is_active: true,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "get-bundle-data-for-update" });

    // Step 3: Find and remove existing bundle items (same pattern as remove workflow)
    const itemsToRemove = transform(
      {
        cart: cartQuery.data[0],
        bundle_id,
      },
      (data) => {
        const existingBundleItems =
          data.cart.items?.filter(
            (item) =>
              item?.metadata?.bundle_id === data.bundle_id &&
              (item?.metadata?.is_from_bundle === true ||
                item?.metadata?.is_bundle_item === true)
          ) || [];

        console.log(
          `🗑️ Found ${existingBundleItems.length} existing bundle items to remove`
        );

        return existingBundleItems.map((item) => item?.id);
      }
    );

    // Step 4: Remove existing bundle items (same pattern as remove workflow)
    deleteLineItemsWorkflow.runAsStep({
      input: {
        cart_id,
        ids: itemsToRemove,
      },
    });

    // Step 5: Prepare new cart items with bundle metadata (same pattern as add workflow)
    const itemsToAdd = prepareFlexibleBundleCartDataStep({
      bundle: bundleQuery.data[0],
      cart: cartQuery.data[0],
      selectedItems,
    });

    // Step 6: Add new items to cart (same pattern as add workflow)
    addToCartWorkflow.runAsStep({
      input: {
        cart_id,
        items: itemsToAdd,
      },
    });

    // Step 7: Get final cart (same pattern as add workflow)
    //@ts-ignore
    const finalCartQuery = useQueryGraphStep({
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
    }).config({ name: "get-final-updated-cart" });

    return new WorkflowResponse(finalCartQuery.data[0]);
  }
);
