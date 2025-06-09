import { MedusaService } from "@medusajs/framework/utils";
import { Bundle } from "./models/bundle";
import { BundleItem } from "./models/bundle-item";

export default class BundleModuleService extends MedusaService({
  Bundle,
  BundleItem,
}) {
  async validateBundleConfiguration(bundleId: string, selectedItems: string[]) {
    const [bundle] = await this.listBundles(
      { id: bundleId },
      { relations: ["items"] }
    );

    if (!bundle || !bundle.is_active) {
      throw new Error("Bundle not found or inactive");
    }

    const selectedCount = selectedItems.length;

    // Validate based on bundle type
    switch (bundle.bundle_type) {
      case "fixed":
        if (selectedCount !== bundle.items.length) {
          throw new Error("Fixed bundle must include all items");
        }
        break;

      case "pick_any":
        if (selectedCount === 0) {
          throw new Error("Must select at least one item");
        }
        break;

      case "pick_x_from_y":
        if (selectedCount !== bundle.items_to_pick) {
          throw new Error(`Must select exactly ${bundle.items_to_pick} items`);
        }
        break;
    }

    // Check required items
    const requiredItems = bundle.items.filter((item) => item.is_required);
    const missingRequired = requiredItems.filter(
      (req) => !selectedItems.includes(req.id)
    );

    if (missingRequired.length > 0) {
      throw new Error("Missing required bundle items");
    }

    return true;
  }
}
