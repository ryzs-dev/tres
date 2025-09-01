import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { QueryContext } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const query = req.scope.resolve("query");
  const { currency_code, region_id } = req.query;

  const { data } = await query.graph(
    {
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
        "items.product.options.*",
        "items.product.options.values.*",
        "items.product.variants.*",
        "items.product.variants.calculated_price.*",
        "items.product.variants.options.*",
        "items.product.variants.inventory_items.inventory.*",
        "items.product.variants.inventory_items.inventory.location_levels.*",
        "items.product.variants.inventory_items.inventory.location_levels.available_quantity",
        "items.product.variants.inventory_items.inventory.location_levels.stocked_quantity",
        "items.product.variants.inventory_items.inventory.location_levels.reserved_quantity",
      ],
      filters: {
        id,
        is_active: true, // Only return active bundles to customers
      },
      context: {
        items: {
          product: {
            variants: {
              calculated_price: QueryContext({
                region_id,
                currency_code,
              }),
            },
          },
        },
      },
    },
    {
      throwIfKeyNotFound: true,
    }
  );

  const bundle = data[0];

  // Sort items by sort_order for consistent display
  if (bundle.items) {
    bundle.items.sort((a, b) => (a?.sort_order || 0) - (b?.sort_order || 0));
  }

  res.json({
    flexible_bundle: bundle,
  });
}
