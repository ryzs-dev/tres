import { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { getVariantAvailability } from "@medusajs/framework/utils";

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query");
  const sales_channel_ids = req.publishable_key_context.sales_channel_ids;

  // Type-safe extraction of variant_id
  const variant_id = Array.isArray(req.query.variant_id)
    ? req.query.variant_id[0]
    : req.query.variant_id;

  // Additional type check to ensure it's a string
  if (!variant_id || typeof variant_id !== "string") {
    return res
      .status(400)
      .json({
        message: "variant_id query parameter is required and must be a string",
      });
  }

  const availability = await getVariantAvailability(query, {
    variant_ids: [variant_id],
    sales_channel_id: sales_channel_ids[0],
  });

  const variantAvailability = availability[variant_id];

  res.json({
    variant_id,
    stock: variantAvailability?.availability ?? 0,
    in_stock: (variantAvailability?.availability ?? 0) > 0,
    sales_channel_id: variantAvailability?.sales_channel_id ?? null,
  });
}
