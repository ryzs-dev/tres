// src/workflows/steps/update-bundle.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import BundledProductModuleService from "../../modules/bundled-product/service";
import { BUNDLED_PRODUCT_MODULE } from "../../modules/bundled-product";

type UpdateBundleStepInput = {
  bundle_id: string;
  update_data: {
    title?: string;
    handle?: string;
    description?: string;
    is_active?: boolean;
    min_items?: number;
    max_items?: number;
    selection_type?: string;
    discount_type?: string;
    discount_2_items?: number | null;
    discount_3_items?: number | null;
    discount_2_items_amount?: number | null;
    discount_3_items_amount?: number | null;
  };
};

export const updateBundleStep = createStep(
  "update-bundle",
  async ({ bundle_id, update_data }: UpdateBundleStepInput, { container }) => {
    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    // Remove undefined fields
    const cleanUpdateData = Object.fromEntries(
      Object.entries(update_data).filter(([_, value]) => value !== undefined)
    );

    try {
      const updateResult = await bundledProductModuleService.updateBundles([
        { id: bundle_id, ...cleanUpdateData },
      ]);

      const verify = await bundledProductModuleService.listBundles({
        id: bundle_id,
      });

      if (verify?.[0]) {
        return new StepResponse(verify[0]);
      }

      throw new Error("Bundle update verification failed");
    } catch (error) {
      throw error;
    }
  }
);
