import { model } from "@medusajs/framework/utils";
import { Bundle } from "./bundle";

export const BundleItem = model.define("bundle_item", {
  id: model.id().primaryKey(),
  bundle: model.belongsTo(() => Bundle, { mappedBy: "items" }),

  // Product reference (linked via remote links)
  product_id: model.text(),

  // Admin Configuration
  default_quantity: model.number().default(1),
  is_required: model.boolean().default(false),
  sort_order: model.number().default(0),

  // Admin pricing overrides
  custom_price: model.number().nullable(),
  item_discount: model.number().nullable(),
});
