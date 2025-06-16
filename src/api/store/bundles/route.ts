import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query");
    const { currency_code, region_id, limit = 12, offset = 0 } = req.query;

    console.log("Store Bundles API called with:", {
      currency_code,
      region_id,
      limit,
      offset,
    });

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
        "discount_2_items", // Include discount fields for frontend
        "discount_3_items", // Include discount fields for frontend
        "created_at",
        "updated_at",
        "items.*",
        "items.product.*",
        "items.product.title",
        "items.product.handle",
        "items.product.thumbnail",
        "items.product.status",
        "items.product.variants.*",
        "items.quantity",
        "items.is_optional",
        "items.sort_order",
      ],
      filters: {
        is_active: true, // Only show active bundles
      },
      pagination: {
        take: parseInt(limit as string) || 12,
        skip: parseInt(offset as string) || 0,
      },
    });

    console.log(`Found ${bundles?.length || 0} bundles`);

    res.json({
      bundles: bundles || [],
      count: metadata?.count || 0,
      limit: parseInt(limit as string) || 12,
      offset: parseInt(offset as string) || 0,
    });
  } catch (error) {
    console.error("Error fetching store bundles:", error);
    res.status(500).json({
      error: "Failed to fetch bundles",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
