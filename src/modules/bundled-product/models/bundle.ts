// src/modules/bundled-product/models/bundle.ts
import { model } from "@medusajs/framework/utils";
import { BundleItem } from "./bundle-item";

export const Bundle = model.define("bundle", {
  id: model.id().primaryKey(),
  title: model.text().nullable(),
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

  // UPDATED: Fixed discount amounts in cents (not percentages)
  discount_2_items_amount: model.number().nullable(), // Fixed amount off in cents (e.g., 2000 = 20RM)
  discount_3_items_amount: model.number().nullable(), // Fixed amount off in cents (e.g., 3000 = 30RM)

  // Keep old fields for backward compatibility during migration
  discount_2_items: model.number().nullable(), // DEPRECATED
  discount_3_items: model.number().nullable(), // DEPRECATED

  // NEW: Discount type field to distinguish between percentage and fixed
  discount_type: model.text().default("fixed"), // "percentage" or "fixed"
});
