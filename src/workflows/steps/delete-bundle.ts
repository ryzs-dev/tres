// src/workflows/steps/delete-bundle.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import BundledProductModuleService from "../../modules/bundled-product/service";
import { BUNDLED_PRODUCT_MODULE } from "../../modules/bundled-product";

type DeleteBundleStepInput = {
  bundle_id: string;
};

export const deleteBundleStep = createStep(
  "delete-bundle",
  async ({ bundle_id }: DeleteBundleStepInput, { container }) => {
    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    try {
      await bundledProductModuleService.deleteBundles(bundle_id);
      console.log(`Successfully deleted bundle: ${bundle_id}`);

      return new StepResponse({ deleted: true, bundle_id });
    } catch (error) {
      console.error(`Failed to delete bundle ${bundle_id}:`, error);
      throw error;
    }
  },
  async (data, { container }) => {
    // Compensation: This step cannot be easily reversed
    // since we've deleted the bundle, so we'll log the attempt
    console.warn(`Cannot restore deleted bundle: ${data?.bundle_id}`);
  }
);

// src/workflows/steps/delete-bundle-items.ts
type DeleteBundleItemsStepInput = {
  item_ids: string[];
};

export const deleteBundleItemsStep = createStep(
  "delete-bundle-items",
  async ({ item_ids }: DeleteBundleItemsStepInput, { container }) => {
    if (!item_ids.length) {
      return new StepResponse({ deleted: 0, item_ids: [] });
    }

    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    try {
      await bundledProductModuleService.deleteBundleItems(item_ids);
      console.log(`Successfully deleted ${item_ids.length} bundle items`);

      return new StepResponse({ deleted: item_ids.length, item_ids });
    } catch (error) {
      console.error(`Failed to delete bundle items:`, error);
      throw error;
    }
  },
  async (data, { container }) => {
    // Compensation: This step cannot be easily reversed
    console.warn(
      `Cannot restore deleted bundle items: ${data?.item_ids?.join(", ")}`
    );
  }
);
