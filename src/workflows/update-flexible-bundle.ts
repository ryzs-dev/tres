// src/workflows/update-flexible-bundle.ts - FIXED
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { updateBundleStep } from "./steps/update-bundle";
import { updateBundleItemsStep } from "./steps/update-bundle-items";

export type UpdateFlexibleBundleWorkflowInput = {
  bundle_id: string;
  update_data: {
    title?: string;
    handle?: string;
    description?: string;
    is_active?: boolean;
    min_items?: number;
    max_items?: number;
    selection_type?: "flexible" | "required_all";

    // Discount fields - ALLOW NULL VALUES
    discount_type?: "percentage" | "fixed";
    discount_2_items?: number | null;
    discount_3_items?: number | null;
    discount_2_items_amount?: number | null;
    discount_3_items_amount?: number | null;

    items?: {
      id?: string;
      product_id: string;
      quantity: number;
      is_optional?: boolean;
      sort_order?: number;
    }[];
  };
};

export const updateFlexibleBundleWorkflow = createWorkflow(
  "update-flexible-bundle",
  ({ bundle_id, update_data }: UpdateFlexibleBundleWorkflowInput) => {
    // Get current bundle data
    //@ts-ignore
    const { data: currentBundles } = useQueryGraphStep({
      entity: "bundle",
      fields: ["*", "items.*"],
      filters: { id: bundle_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-current-bundle" });

    const currentBundle = transform(
      { currentBundles },
      (data) => data.currentBundles[0]
    );

    // Update bundle basic info
    const updatedBundle = updateBundleStep({
      bundle_id,
      update_data: {
        title: update_data.title,
        handle: update_data.handle,
        description: update_data.description,
        is_active: update_data.is_active,
        min_items: update_data.min_items,
        max_items: update_data.max_items,
        selection_type: update_data.selection_type,
        discount_type: update_data.discount_type,
        discount_2_items: update_data.discount_2_items,
        discount_3_items: update_data.discount_3_items,
        discount_2_items_amount: update_data.discount_2_items_amount,
        discount_3_items_amount: update_data.discount_3_items_amount,
      },
    });

    // Update bundle items if provided
    //@ts-ignore
    const updatedItems = transform(
      { update_data, currentBundle },
      (data: {
        update_data: UpdateFlexibleBundleWorkflowInput["update_data"];
        currentBundle: any;
      }) => {
        if (!data.update_data.items) {
          return null;
        }
        return data.update_data.items.map((item, index) => ({
          ...item,
          bundle_id: bundle_id,
          sort_order: item.sort_order ?? index,
        }));
      }
    );

    // Update items if provided
    const itemsResult = updateBundleItemsStep({
      bundle_id,
      items: updatedItems,
      current_items: currentBundle.items,
    });

    // Retrieve final updated bundle with all discount fields
    //@ts-ignore
    const { data: finalBundles } = useQueryGraphStep({
      entity: "bundle",
      fields: [
        "*",
        "items.*",
        "items.product.*",
        "discount_type",
        "discount_2_items",
        "discount_3_items",
        "discount_2_items_amount",
        "discount_3_items_amount",
      ],
      filters: { id: bundle_id },
    }).config({ name: "get-updated-bundle" });

    return new WorkflowResponse(
      transform({ finalBundles }, (data) => data.finalBundles[0])
    );
  }
);
