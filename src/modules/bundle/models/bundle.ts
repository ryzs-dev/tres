import { model } from "@medusajs/framework/utils";
import { BundleItem } from "./bundle-item";

export const Bundle = model.define("bundle", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),

  // Admin Configuration - Bundle Behavior
  bundle_type: model
    .enum(["fixed", "pick_any", "pick_x_from_y"])
    .default("fixed"),

  // For "pick_x_from_y" bundles: "Pick 3 items from these 5 options"
  items_to_pick: model.number().nullable(),

  // Pricing - Admin sets the rules
  pricing_type: model
    .enum(["sum_prices", "fixed_price", "percentage_off"])
    .default("sum_prices"),
  fixed_price: model.number().nullable(),
  discount_percentage: model.number().nullable(),

  // Status
  is_active: model.boolean().default(true),

  // Relations
  items: model.hasMany(() => BundleItem, { mappedBy: "bundle" }),
});
