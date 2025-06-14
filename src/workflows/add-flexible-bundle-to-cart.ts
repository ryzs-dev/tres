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
    quantity?: number; // Optional custom quantity per item
  }[];
};

export const addFlexibleBundleToCartWorkflow = createWorkflow(
  "add-flexible-bundle-to-cart",
  ({
    cart_id,
    bundle_id,
    selectedItems,
  }: AddFlexibleBundleToCartWorkflowInput) => {
    // Fetch bundle with items, products, and pricing information
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
        "items.product.variants.calculated_price.*", // Include calculated pricing
        "items.product.variants.prices.*", // Include price variants
      ],
      filters: {
        id: bundle_id,
        is_active: true, // Only allow active bundles
      },
      options: {
        throwIfKeyNotFound: true,
      },
    });

    // Prepare cart data for selected items with bundle discount logic
    const itemsToAdd = prepareFlexibleBundleCartDataStep({
      bundle: bundles[0],
      selectedItems,
    } as unknown as PrepareFlexibleBundleCartDataStepInput);

    // Add selected items to cart with bundle pricing
    addToCartWorkflow.runAsStep({
      input: {
        cart_id,
        items: itemsToAdd,
      },
    });

    // Fetch updated cart with comprehensive item information
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
    }).config({ name: "refetch-cart" });

    return new WorkflowResponse(updatedCarts[0]);
  }
);
