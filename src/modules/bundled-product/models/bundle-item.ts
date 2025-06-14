import { model } from "@medusajs/framework/utils";
import { Bundle } from "./bundle";

export const BundleItem = model.define("bundle_item", {
  id: model.id().primaryKey(),
  quantity: model.number().default(1),
  is_optional: model.boolean().default(true),
  sort_order: model.number().default(0),

  // Add metadata field that might be expected
  metadata: model.json().nullable(),

  bundle: model.belongsTo(() => Bundle, {
    mappedBy: "items",
  }),
});
