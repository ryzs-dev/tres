// src/modules/bundled-product/models/bundle.ts
import { model } from "@medusajs/framework/utils";
import { BundleItem } from "./bundle-item";

export const Bundle = model.define("bundle", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  collection_id: model.text().nullable(), // Add this to link to ProductCollection
  items: model.hasMany(() => BundleItem, {
    mappedBy: "bundle",
  }),
  // Selection rules
  min_items: model.number().default(1).nullable(), // Minimum items to select
  max_items: model.number().nullable(), // Maximum items to select (null = no limit)
  selection_type: model.text().default("flexible"), // "flexible" or "fixed"

  // Optional: Add fields for custom bundle logic
  discount: model.number().nullable(), // e.g., percentage discount for the bundle
  is_active: model.boolean().default(true), // To enable/disable bundles

  // Promotional pricing rules (if you want to make them configurable)
  discount_2_items: model.number().nullable(), // 10% for 2 items
  discount_3_items: model.number().nullable(), // 15% for 3 items
});
