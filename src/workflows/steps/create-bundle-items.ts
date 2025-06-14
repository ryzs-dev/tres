import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { BUNDLED_PRODUCT_MODULE } from "../../modules/bundled-product";
import BundledProductModuleService from "../../modules/bundled-product/service";

type CreateBundleItemsStepInput = {
  bundle_id: string;
  items: {
    product_id: string;
    quantity: number;
    is_optional?: boolean;
    sort_order?: number;
  }[];
};

export const createBundleItemsStep = createStep(
  "create-bundle-items",
  async ({ bundle_id, items }: CreateBundleItemsStepInput, { container }) => {
    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    const bundleItems = await bundledProductModuleService.createBundleItems(
      items.map((item, index) => ({
        bundle_id,
        quantity: item.quantity,
        is_optional: item.is_optional ?? true, // Default to optional for flexible bundles
        sort_order: item.sort_order ?? index, // Default to order in array
      }))
    );

    return new StepResponse(
      {
        bundleItems,
        productIds: items.map((item) => item.product_id),
      },
      bundleItems.map((item) => item.id)
    );
  },
  async (itemIds, { container }) => {
    if (!itemIds?.length) {
      return;
    }

    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    await bundledProductModuleService.deleteBundleItems(itemIds);
  }
);
