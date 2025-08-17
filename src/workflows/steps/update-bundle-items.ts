// src/workflows/steps/update-bundle-items.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import BundledProductModuleService from "../../modules/bundled-product/service";
import { BUNDLED_PRODUCT_MODULE } from "../../modules/bundled-product";

type UpdateBundleItemsStepInput = {
  bundle_id: string;
  items: any[] | null;
  current_items: any[];
};

export const updateBundleItemsStep = createStep(
  "update-bundle-items",
  async (
    { bundle_id, items, current_items }: UpdateBundleItemsStepInput,
    { container }
  ) => {
    if (!items) {
      console.log("⏭️ No items to update");
      return new StepResponse(current_items);
    }

    const bundledProductModuleService: BundledProductModuleService =
      container.resolve(BUNDLED_PRODUCT_MODULE);

    console.log("🔧 Updating bundle items for bundle:", bundle_id);
    console.log("📋 Current items:", current_items?.length || 0);
    console.log("📋 New items:", items?.length || 0);

    try {
      // Delete all existing items first
      if (current_items?.length > 0) {
        const currentItemIds = current_items.map((item) => item.id);
        console.log("🗑️ Deleting existing items:", currentItemIds);
        await bundledProductModuleService.deleteBundleItems(currentItemIds);
      }

      // Create new items
      console.log("➕ Creating new items:", items);
      const newItems = await bundledProductModuleService.createBundleItems(
        items.map((item) => ({
          bundle_id,
          product_id: item.product_id,
          quantity: item.quantity,
          is_optional: item.is_optional ?? true,
          sort_order: item.sort_order ?? 0,
        }))
      );

      console.log(
        "✅ Updated bundle items successfully:",
        newItems?.length || 0
      );
      return new StepResponse(newItems);
    } catch (error) {
      console.error("❌ Error updating bundle items:", error);
      throw error;
    }
  }
);
