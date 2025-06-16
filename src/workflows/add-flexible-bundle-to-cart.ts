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
    // FIXED: Get cart first with unique step name
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
    }).config({ name: "get-cart-for-bundle" }); // FIXED: Unique name

    // FIXED: Get bundle with unique step name
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
        "items.*",
        "items.product.*",
        "items.product.variants.*",
      ],
      filters: {
        id: bundle_id,
        is_active: true,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "get-bundle-for-cart" }); // FIXED: Unique name

    // Prepare cart data with currency context
    //@ts-ignore
    const itemsToAdd = prepareFlexibleBundleCartDataStep({
      bundle: bundles[0],
      cart: cartData[0],
      selectedItems,
    } as PrepareFlexibleBundleCartDataStepInput);

    // Add selected items to cart with bundle pricing
    addToCartWorkflow.runAsStep({
      input: {
        cart_id,
        items: itemsToAdd,
      },
    });

    // FIXED: Fetch updated cart with unique step name
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
    }).config({ name: "refetch-updated-cart" }); // FIXED: Unique name

    return new WorkflowResponse(updatedCarts[0]);
  }
);
