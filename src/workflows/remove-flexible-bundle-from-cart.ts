import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  deleteLineItemsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";

type RemoveFlexibleBundleFromCartWorkflowInput = {
  bundle_id: string;
  cart_id: string;
};

export const removeFlexibleBundleFromCartWorkflow = createWorkflow(
  "remove-flexible-bundle-from-cart",
  ({ bundle_id, cart_id }: RemoveFlexibleBundleFromCartWorkflowInput) => {
    // Get cart with items and their metadata
    //@ts-ignore
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      fields: ["*", "items.*", "items.metadata"],
      filters: {
        id: cart_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    });

    // Find flexible bundle items to remove
    const itemsToRemove = transform(
      {
        cart: carts[0],
        bundle_id,
      },
      (data) => {
        console.log(
          `Looking for flexible bundle items with bundle_id: ${data.bundle_id}`
        );

        const bundleItems =
          data.cart.items?.filter((item) => {
            // Check for flexible bundle metadata
            const isFlexibleBundleItem =
              item?.metadata?.bundle_id === data.bundle_id &&
              (item?.metadata?.is_from_bundle === true ||
                item?.metadata?.is_bundle_item === true);

            if (isFlexibleBundleItem) {
              console.log(
                `Found flexible bundle item: ${item.id} for bundle: ${data.bundle_id}`
              );
            }

            return isFlexibleBundleItem;
          }) || [];

        console.log(
          `Found ${bundleItems.length} flexible bundle items to remove`
        );

        return bundleItems.map((item) => item?.id);
      }
    );

    // Remove the items using the core workflow
    deleteLineItemsWorkflow.runAsStep({
      input: {
        cart_id,
        ids: itemsToRemove.filter((id): id is string => id !== undefined),
      },
    });

    // Retrieve updated cart with comprehensive fields
    // @ts-ignore
    const { data: updatedCarts } = useQueryGraphStep({
      entity: "cart",
      fields: [
        "*",
        "items.*",
        "items.variant.*",
        "items.product.*",
        "items.metadata",
        "total",
        "subtotal",
        "tax_total",
      ],
      filters: {
        id: cart_id,
      },
    }).config({ name: "retrieve-updated-cart" });

    return new WorkflowResponse(updatedCarts[0]);
  }
);
