import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import BundledProductModuleService from "../../modules/bundled-product/service";
import { BUNDLED_PRODUCT_MODULE } from "../../modules/bundled-product";

type CreateBundleStepInput = {
  title: string;
  handle: string;
  description?: string;
  is_active?: boolean;
  min_items?: number;
  max_items?: number;
  selection_type?: "flexible" | "required_all";
};

export const createBundleStep = createStep(
  "create-bundle",
  async (input: CreateBundleStepInput, { container }) => {
    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    const bundle = await bundledProductModuleService.createBundles({
      title: input.title,
      is_active: input.is_active ?? true,
      min_items: input.min_items ?? 1,
      max_items: input.max_items || null,
      selection_type: input.selection_type ?? "flexible",
    });

    return new StepResponse(bundle, bundle.id);
  },
  async (bundleId, { container }) => {
    if (!bundleId) {
      return;
    }
    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    await bundledProductModuleService.deleteBundles(bundleId);
  }
);
