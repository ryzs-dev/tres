// src/workflows/steps/create-bundle.ts - FIXED VERSION
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import BundledProductModuleService from "../../modules/bundled-product/service";
import { BUNDLED_PRODUCT_MODULE } from "../../modules/bundled-product";

type CreateBundleStepInput = {
  title: string;
  handle?: string;
  description?: string;
  is_active?: boolean;
  min_items?: number;
  max_items?: number;
  selection_type?: string;
  discount_2_items?: number;
  discount_3_items?: number;
};

export const createBundleStep = createStep(
  "create-bundle",
  async (input: CreateBundleStepInput, { container }) => {
    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    console.log("🔧 Creating bundle with input:", input);

    // FIXED: Ensure title is properly passed and not used as ID
    const bundleData = {
      title: input.title, // Explicitly set title
      handle: input.handle || input.title.toLowerCase().replace(/\s+/g, "-"),
      description: input.description || undefined,
      is_active: input.is_active ?? true,
      min_items: input.min_items ?? 1,
      max_items: input.max_items || undefined,
      selection_type: input.selection_type ?? "flexible",
      discount_2_items: input.discount_2_items || undefined,
      discount_3_items: input.discount_3_items || undefined,
    };

    console.log("📦 Bundle data to create:", bundleData);

    try {
      const bundle =
        await bundledProductModuleService.createBundles(bundleData);
      console.log("✅ Created bundle successfully:", bundle);
      return new StepResponse(bundle, bundle.id);
    } catch (error) {
      console.error("❌ Error creating bundle:", error);
      throw error;
    }
  },
  async (bundleId, { container }) => {
    if (!bundleId) {
      return;
    }

    console.log("🔄 Compensating: deleting bundle", bundleId);

    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    try {
      await bundledProductModuleService.deleteBundles(bundleId);
      console.log("✅ Compensated: deleted bundle", bundleId);
    } catch (error) {
      console.error("❌ Error in compensation:", error);
    }
  }
);
