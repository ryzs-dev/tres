import { model } from "@medusajs/framework/utils";
import { BundleItem } from "./bundle-item";

export const Bundle = model.define("bundle", {
  id: model.id().primaryKey(),
  title: model.text(),
  items: model.hasMany(() => BundleItem, {
    mappedBy: "bundle",
  }),
  // Optional: Add fields for custom bundle logic
  discount: model.number().nullable(), // e.g., percentage discount for the bundle
  is_active: model.boolean().default(true), // To enable/disable bundles
});
