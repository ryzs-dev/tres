// src/workflows/add-flexible-bundle-to-cart.ts - UPDATED WITH FIXED DISCOUNT FIELDS
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  addToCartWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { prepareFlexibleBundleCartDataStep } from "./steps/prepare-bundle-cart-data";

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
  (input: AddFlexibleBundleToCartWorkflowInput) => {
    const { cart_id, bundle_id, selectedItems } = input;

    const variantIds = transform({ selectedItems }, (data) =>
      Array.isArray(data.selectedItems)
        ? data.selectedItems.map((item) => item.variant_id)
        : []
    );

    // Get cart data
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      fields: ["id", "region_id", "currency_code", "region.*"],
      filters: { id: cart_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-cart-for-bundle" });

    // Get bundle data
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
      filters: { id: bundle_id, is_active: true },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-bundle-data" });

    const variantQuery = useQueryGraphStep({
      entity: "variant",
      fields: ["*", "product.*", "prices.*"],
      filters: { id: variantIds },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-selected-variants" });

    // Prepare cart items with bundle metadata
    const itemsToAdd = prepareFlexibleBundleCartDataStep({
      bundle: bundleQuery.data[0],
      cart: cartQuery.data[0],
      selectedItems,
      productVariants: variantQuery.data,
    });

    // Add items to cart
    addToCartWorkflow.runAsStep({
      input: {
        cart_id,
        items: itemsToAdd,
      },
    });

    // Get final cart
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
