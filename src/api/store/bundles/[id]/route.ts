// src/api/store/bundles/[id]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const query = req.scope.resolve("query");
    const { currency_code = "MYR", region_id } = req.query; // Default to MYR

    console.log("=== BUNDLE BY ID ===");
    console.log("Bundle ID:", id);
    console.log("Currency:", currency_code, "Region:", region_id);

    // First get bundle with items
    const { data: bundles } = await query.graph({
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
        "discount_2_items",
        "discount_3_items",
        "created_at",
        "updated_at",
        "items.*",
      ],
      filters: { id, is_active: true },
    });

    if (!bundles?.length) {
      return res.status(404).json({
        error: "Bundle not found",
        id: id,
      });
    }

    const bundle = bundles[0];

    // Fetch products with pricing for each item
    const itemsWithProducts = await Promise.all(
      bundle.items.map(async (item) => {
        if (!item?.product_id) return item;

        try {
          // Get product with variants and basic pricing
          const { data: products } = await query.graph({
            entity: "product",
            fields: [
              "id",
              "title",
              "handle",
              "description",
              "thumbnail",
              "status",
              "variants.*",
              "variants.prices.*", // Get basic prices instead of calculated_price
            ],
            filters: { id: item.product_id },
          });

          const product = products[0];
          if (product && product.variants) {
            // Add basic price calculation for each variant
            product.variants = product.variants.map((variant) => {
              if (variant.prices && variant.prices.length > 0) {
                // Find price for the requested currency or default to first price
                const price =
                  variant.prices.find(
                    (p) => p.currency_code === currency_code
                  ) || variant.prices[0];

                // Add calculated_price_number for compatibility
                return {
                  ...variant,
                  calculated_price_number: price ? price.amount : 0, // Convert cents to currency units
                  calculated_price: price
                    ? {
                        calculated_amount: price.amount,
                        currency_code: price.currency_code,
                      }
                    : null,
                };
              }
              return variant;
            });
          }

          return { ...item, product };
        } catch (error) {
          console.error(`Error fetching product ${item.product_id}:`, error);
          return item;
        }
      })
    );

    const bundleWithProducts = {
      ...bundle,
      items: itemsWithProducts.sort(
        (a, b) => (a?.sort_order || 0) - (b?.sort_order || 0)
      ),
    };

    console.log(
      "Found bundle:",
      bundleWithProducts.title,
      "with",
      bundleWithProducts.items?.length,
      "items"
    );

    res.json({
      bundle: bundleWithProducts,
    });
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({
      error: "Failed to fetch bundle",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
