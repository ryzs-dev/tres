// src/api/store/bundles/[id]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QueryContext } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve("query");
  const { currency_code, region_id } = req.query;

  // Default currency if not provided
  const defaultCurrency = currency_code || "USD";

  console.log("=== BUNDLE BY ID (WITH PRICING) ===");
  console.log("Bundle ID:", id);
  console.log("Currency:", defaultCurrency, "Region:", region_id);

  try {
    // Query bundle with items and linked products INCLUDING pricing
    const { data } = await query.graph({
      entity: "bundle",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "is_active",
        "min_items",
        "max_items",
        "selection_type",
        "created_at",
        "updated_at",
        "items.*",
        "items.product.id",
        "items.product.title",
        "items.product.handle",
        "items.product.description",
        "items.product.thumbnail",
        "items.product.status",
        "items.product.variants.id",
        "items.product.variants.title",
        "items.product.variants.calculated_price.*", // Include pricing
        "items.product.variants.inventory_quantity",
        "items.product.variants.manage_inventory",
        "items.product.variants.allow_backorder",
      ],
      filters: {
        id: id,
        is_active: true,
      },
      // Add pricing context
      context: {
        items: {
          product: {
            variants: {
              calculated_price: QueryContext({
                region_id,
                currency_code: defaultCurrency,
              }),
            },
          },
        },
      },
    });

    console.log(`Found ${data.length} bundles`);

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: "Bundle not found",
        id: id,
      });
    }

    const bundle = data[0];
    console.log(
      "Found bundle:",
      bundle.title,
      "with",
      bundle.items?.length,
      "items"
    );

    // Sort items by sort_order
    if (bundle.items) {
      bundle.items.sort((a, b) => (a?.sort_order || 0) - (b?.sort_order || 0));

      // Log pricing info for debugging
      bundle.items.forEach((item) => {
        if (item) {
          console.log(`Item: ${item.product?.title}`);
          item.product?.variants?.forEach((variant) => {
            console.log(
              `  Variant: ${variant.title}, Price: ${variant.calculated_price?.calculated_amount}`
            );
          });
        }
      });
    }

    res.json({
      flexible_bundle: bundle,
      success: true,
      method: "with_pricing",
    });
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({
      error: "Failed to fetch bundle",
      message: error.message,
    });
  }
}
