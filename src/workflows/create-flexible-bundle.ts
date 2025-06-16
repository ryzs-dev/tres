// src/workflows/create-flexible-bundle.ts
import { CreateProductWorkflowInputDTO } from "@medusajs/framework/types";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createBundleStep } from "./steps/create-bundle";
import { createBundleItemsStep } from "./steps/create-bundle-items";
import {
  createProductsWorkflow,
  createRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { BUNDLED_PRODUCT_MODULE } from "../modules/bundled-product";
import { Modules } from "@medusajs/framework/utils";

export type CreateFlexibleBundleWorkflowInput = {
  bundle: {
    title: string;
    handle?: string;
    description?: string;
    is_active?: boolean;
    min_items?: number;
    max_items?: number;
    selection_type?: "flexible" | "required_all";
    discount_2_items?: number; // ADDED
    discount_3_items?: number; // ADDED
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
    // Create the bundle with all fields including discounts
    const bundle = createBundleStep({
      title: bundleData.title,
      handle: bundleData.handle ?? "",
      description: bundleData.description,
      is_active: bundleData.is_active ?? true,
      min_items: bundleData.min_items ?? 1,
      max_items: bundleData.max_items,
      selection_type: bundleData.selection_type ?? "flexible",
      discount_2_items: bundleData.discount_2_items, // ADDED
      discount_3_items: bundleData.discount_3_items, // ADDED
    });

    // Create bundle items
    const bundleItems = createBundleItemsStep({
      bundle_id: bundle.id,
      items: bundleData.items,
    });

    // Create remote links between bundle items and products
    const bundleProductLinks = transform(
      {
        bundleData,
        bundleItems,
      },
      (data) => {
        return Array.isArray(data.bundleItems)
          ? data.bundleItems.map((item, index) => ({
              [BUNDLED_PRODUCT_MODULE]: {
                id: item.id, // ← Correct key
              },
              [Modules.PRODUCT]: {
                id: data.bundleData.items[index].product_id, // ← Also change to id
              },
            }))
          : [];
      }
    );

    createRemoteLinkStep(bundleProductLinks).config({
      name: "create-bundle-product-items-links",
    });

    // Retrieve the complete bundle with items
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
