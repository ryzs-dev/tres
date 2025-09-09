// src/workflows/remove-item-from-bundle.ts
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { updateFlexibleBundleInCartWorkflow } from "./update-flexible-bundle-in-cart";

type RemoveItemFromBundleWorkflowInput = {
  cart_id: string;
  bundle_id: string;
  item_id: string; // Specific bundle item to remove
};

export const removeItemFromBundleWorkflow = createWorkflow(
  "remove-item-from-bundle",
  ({ cart_id, bundle_id, item_id }: RemoveItemFromBundleWorkflowInput) => {
    // Get current cart
    //@ts-ignore
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      fields: ["*", "items.*", "items.metadata"],
      filters: { id: cart_id },
      options: { throwIfKeyNotFound: true },
    });

    // Find remaining bundle items (exclude the one to remove)
    const remainingItems = transform(
      { cart: cartQuery.data[0], bundle_id, item_id },
      (data) => {
        const allBundleItems =
          data.cart.items?.filter(
            (item) =>
              item?.metadata?.bundle_id === data.bundle_id &&
              (item?.metadata?.is_from_bundle === true ||
                item?.metadata?.is_bundle_item === true)
          ) || [];

        // Remove the specific item
        const remaining = allBundleItems.filter(
          (item) => item && item.metadata?.bundle_item_id !== data.item_id
        );

        console.log(
          `Removing item ${data.item_id} from bundle ${data.bundle_id}`
        );
        console.log(`Remaining items: ${remaining.length}`);

        // Convert to format expected by update workflow
        return remaining
          .filter((item) => item !== null) // Ensure item is not null
          .map((item) => ({
            item_id: item.metadata?.bundle_item_id as string,
            variant_id: item.variant_id as string,
            quantity: item.quantity,
          }));
      }
    );

    // Use update workflow to replace bundle with remaining items
    // This will automatically recalculate discounts for the smaller bundle
    updateFlexibleBundleInCartWorkflow.runAsStep({
      input: {
        cart_id,
        bundle_id,
        selectedItems: remainingItems,
      },
    });

    // Get final cart
    //@ts-ignore
    const finalCartQuery = useQueryGraphStep({
      entity: "cart",
      filters: { id: cart_id },
      fields: [
        "id",
        "items.*",
        "items.variant.*",
        "items.product.*",
        "items.metadata",
        "total",
        "subtotal",
        "tax_total",
      ],
    }).config({ name: "get-final-cart-after-item-removal" });

    return new WorkflowResponse(finalCartQuery.data[0]);
  }
);
