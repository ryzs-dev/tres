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

    const variantIds = transform({ selectedItems }, (data) =>
      Array.isArray(data.selectedItems)
        ? data.selectedItems.map((item) => item.variant_id)
        : []
    );

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
    }).config({ name: "get-cart-for-bundle" });

    const variantQuery = useQueryGraphStep({
      entity: "variant",
      fields: ["*", "product.*", "prices.*"],
      filters: { id: variantIds },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-selected-variants" });

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
      ],
      filters: {
        id: bundle_id,
        is_active: true,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "get-bundle-data" });

    const itemsToRemove = transform(
      {
        cart: cartQuery.data[0],
        bundle_id,
        selectedItems, // ✅ pass it in here
      },
      (data) => {
        const existingBundleItems = data.cart.items?.filter(
          (item) =>
            item?.metadata?.bundle_id === data.bundle_id &&
            Array.isArray(data.selectedItems) &&
            data.selectedItems.some((sel) => sel.variant_id === item.variant_id)
        );

        return existingBundleItems.map((item) => item?.id);
      }
    );

    // Step 4: Remove existing bundle items
    deleteLineItemsWorkflow.runAsStep({
      input: { cart_id, ids: itemsToRemove },
    });

    // ✅ Force Medusa to re-fetch the updated cart (so old items are gone)
    const refreshedCart = useQueryGraphStep({
      entity: "cart",
      fields: ["id", "items.*", "items.metadata"],
      filters: { id: cart_id },
    }).config({ name: "refresh-cart-after-deletion" });

    // Step 5: Prepare new cart items
    const itemsToAdd = prepareFlexibleBundleCartDataStep({
      bundle: bundleQuery.data[0],
      cart: refreshedCart.data[0],
      selectedItems,
      productVariants: variantQuery.data,
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
    }).config({ name: "get-final-cart" });

    return new WorkflowResponse(finalCartQuery.data[0]);
  }
);
