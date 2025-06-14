// src/api/store/bundles/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QueryContext } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query");
  const { currency_code, region_id, limit = 12, offset = 0 } = req.query;

  // Default currency if not provided
  const defaultCurrency = currency_code || "USD";

  console.log("Bundles API called with:", {
    currency_code: defaultCurrency,
    region_id,
    limit,
    offset,
  });

  const { data: bundles, metadata: { count, take, skip } = {} } =
    await query.graph({
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
        // Only include pricing if we have currency context
        ...(defaultCurrency
          ? [
              "items.product.variants.id",
              "items.product.variants.title",
              "items.product.variants.calculated_price.*",
            ]
          : ["items.product.variants.id", "items.product.variants.title"]),
      ],
      filters: {
        is_active: true, // Only return active bundles
      },
      pagination: {
        skip: parseInt(offset as string) || 0,
        take: parseInt(limit as string) || 12,
      },
      // Only add pricing context if we have currency
      ...(defaultCurrency
        ? {
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
          }
        : {}),
    });

  console.log(`Found ${bundles.length} bundles`);

  // Sort items by sort_order
  const sortedBundles = bundles.map((bundle) => ({
    ...bundle,
    items:
      bundle.items?.sort(
        (a, b) => (a?.sort_order || 0) - (b?.sort_order || 0)
      ) || [],
  }));

  res.json({
    flexible_bundles: sortedBundles,
    count: count || 0,
    limit: take || 12,
    offset: skip || 0,
  });
}
