// src/workflows/remove-item-from-bundle.ts
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  deleteLineItemsStep,
  deleteLineItemsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { updateFlexibleBundleInCartWorkflow } from "./update-flexible-bundle-in-cart";

type RemoveItemFromBundleWorkflowInput = {
  cart_id: string;
  bundle_id: string;
  item_id: string; // Specific bundle item to remove
};

export const removeItemFromBundleWorkflow = createWorkflow(
  "remove-item-from-bundle",
  ({ cart_id, bundle_id, item_id }: RemoveItemFromBundleWorkflowInput) => {
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
            (item) => item?.metadata?.bundle_id === data.bundle_id
          ) || [];

        // Remove the specific item
        const remaining = allBundleItems.filter(
          (item) => item?.metadata?.bundle_item_id !== data.item_id
        );

        // Format for update workflow
        return remaining.map((item) => ({
          item_id: item?.metadata?.bundle_item_id as string,
          variant_id: item?.variant_id as string,
          quantity: item?.quantity,
        }));
      }
    );

    const lineItemToRemoveId = transform(
      { cart: cartQuery.data[0], item_id },
      (data) => {
        const lineItem = data.cart.items.find(
          (item) => item?.metadata?.bundle_item_id === data.item_id
        );

        if (!lineItem) {
          return null;
        }

        return lineItem.id;
      }
    );

    if (lineItemToRemoveId) {
      deleteLineItemsWorkflow.runAsStep({
        input: {
          cart_id,
          ids: [lineItemToRemoveId],
        },
      });
    }

    // Update bundle with remaining items
    updateFlexibleBundleInCartWorkflow.runAsStep({
      input: {
        cart_id,
        bundle_id,
        selectedItems: remainingItems,
      },
    });

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
