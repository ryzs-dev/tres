// src/api/store/bundles/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QueryContext } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query");
    const { currency_code, region_id, limit = 12, offset = 0 } = req.query;

    // Get bundles with items
    const { data: bundles, metadata } = await query.graph({
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
      filters: { is_active: true },
      pagination: {
        take: parseInt(limit as string) || 12,
        skip: parseInt(offset as string) || 0,
      },
    });

    // Fetch products for each bundle
    const bundlesWithProducts = await Promise.all(
      bundles.map(async (bundle) => {
        const itemsWithProducts = await Promise.all(
          bundle.items.map(async (item) => {
            if (!item || !item.product_id) return item;

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
              ],
              filters: { id: item?.product_id || undefined },
            });

            return { ...item, product: products[0] || null };
          })
        );

        return { ...bundle, items: itemsWithProducts };
      })
    );

    res.json({
      flexible_bundles: bundlesWithProducts,
      count: metadata?.count || 0,
      limit: parseInt(limit as string) || 12,
      offset: parseInt(offset as string) || 0,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch bundles" });
  }
}
