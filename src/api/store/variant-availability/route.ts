import { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http";
import { getVariantAvailability } from "@medusajs/framework/utils";

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query");
  const sales_channel_ids = req.publishable_key_context.sales_channel_ids;

  const variant_id = req.query.variant_id;

  if (!variant_id) {
    return res
      .status(400)
      .json({ message: "variant_id query parameter is required" });
  }

  const availability = await getVariantAvailability(query, {
    variant_ids: [variant_id],
    sales_channel_id: sales_channel_ids[0],
  });

  const variantAvailability = availability[variant_id];

  res.json({
    variant_id,
    stock: variantAvailability?.availability ?? 0, // numeric availability
    in_stock: (variantAvailability?.availability ?? 0) > 0, // boolean flag
    sales_channel_id: variantAvailability?.sales_channel_id ?? null, // optional
  });
}
