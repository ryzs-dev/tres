import { model } from "@medusajs/framework/utils";
import { Bundle } from "./bundle";

export const BundleItem = model.define("bundle_item", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  optional: model.boolean().default(false),
  quantity: model.number().default(1),
  bundle: model.belongsTo(() => Bundle, {
    mappedBy: "items",
  }),
});
