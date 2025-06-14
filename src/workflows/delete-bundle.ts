// src/workflows/delete-bundle.ts
import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { deleteBundleItemsStep, deleteBundleStep } from "./steps/delete-bundle";
import { deleteRemoteLinksStep } from "./steps/delete-remote-links";

type DeleteBundleWorkflowInput = {
  bundle_id: string;
};

export const deleteBundleWorkflow = createWorkflow(
  "delete-bundle",
  ({ bundle_id }: DeleteBundleWorkflowInput) => {
    // First, get the bundle with its items to understand what needs to be deleted
    // @ts-ignore
    const { data: bundles } = useQueryGraphStep({
      entity: "bundle",
      fields: ["*", "items.*"],
      filters: {
        id: bundle_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    });

    const bundle = bundles[0];

    // Extract bundle item IDs for deletion
    const bundleItemIds = transform({ bundle }, (data) => {
      return data.bundle.items.map((item: any) => item.id);
    });

    // Delete remote links first (if any exist)
    deleteRemoteLinksStep({
      bundle_id: bundle.id,
      bundle_item_ids: bundleItemIds,
    });

    // Delete bundle items
    deleteBundleItemsStep({
      item_ids: bundleItemIds,
    });

    // Finally, delete the bundle itself
    deleteBundleStep({
      bundle_id: bundle.id,
    });

    return new WorkflowResponse({
      deleted: true,
      bundle_id: bundle.id,
    });
  }
);
