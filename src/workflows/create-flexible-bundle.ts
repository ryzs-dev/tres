import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createBundleStep } from "./steps/create-bundle";
import { createBundleItemsStep } from "./steps/create-bundle-items";
import {
  createRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { BUNDLED_PRODUCT_MODULE } from "../modules/bundled-product";
import { Modules } from "@medusajs/framework/utils";

export type CreateFlexibleBundleWorkflowInput = {
  bundle: {
    title: string;
    handle: string;
    description?: string;
    is_active?: boolean;
    min_items?: number;
    max_items?: number;
    selection_type?: "flexible" | "required_all";
    items: {
      product_id: string;
      quantity: number;
      is_optional?: boolean;
      sort_order?: number;
    }[];
  };
};

export const createFlexibleBundleWorkflow = createWorkflow(
  "create-flexible-bundle",
  ({ bundle: bundleData }: CreateFlexibleBundleWorkflowInput) => {
    // Create the bundle (container only, not a product)
    const bundle = createBundleStep({
      title: bundleData.title,
      handle: bundleData.handle,
      description: bundleData.description,
      is_active: bundleData.is_active,
      min_items: bundleData.min_items,
      max_items: bundleData.max_items,
      selection_type: bundleData.selection_type,
    });

    // Create bundle items
    const bundleItemsResult = createBundleItemsStep({
      bundle_id: bundle.id,
      items: bundleData.items,
    });

    // Link each bundle item to its corresponding product
    const bundleItemProductLinks = transform(
      {
        bundleData,
        bundleItemsResult,
      },
      (data) => {
        return data.bundleItemsResult.bundleItems.map((item, index) => ({
          [BUNDLED_PRODUCT_MODULE]: {
            bundle_item_id: item.id,
          },
          [Modules.PRODUCT]: {
            product_id: data.bundleData.items[index].product_id,
          },
        }));
      }
    );

    createRemoteLinkStep(bundleItemProductLinks).config({
      name: "create-bundle-item-product-links",
    });

    // Retrieve the complete bundle with items and linked products
    // @ts-ignore
    const { data } = useQueryGraphStep({
      entity: "bundle",
      fields: ["*", "items.*", "items.product.*"],
      filters: {
        id: bundle.id,
      },
    });

    return new WorkflowResponse(data[0]);
  }
);
