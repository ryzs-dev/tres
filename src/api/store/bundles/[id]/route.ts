import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params;
    const { currency_code, region_id } = req.query;
    const query = req.scope.resolve("query");

    console.log("=== BUNDLE BY ID (WITH PRICING) ===");
    console.log(`Bundle ID: ${id}`);
    console.log(`Currency: ${currency_code} Region: ${region_id}`);

    const { data: bundles } = await query.graph({
      entity: "bundle",
      fields: [
        "*", // All bundle fields including discount_2_items and discount_3_items
        "items.*",
        "items.product.*",
        "items.product.title",
        "items.product.handle",
        "items.product.description",
        "items.product.thumbnail",
        "items.product.status",
        "items.product.variants.*",
        "items.product.variants.title",
        "items.product.variants.prices.*", // Include pricing
        "items.quantity",
        "items.is_optional",
        "items.sort_order",
      ],
      filters: {
        id,
        is_active: true,
      },
    });

    if (!bundles?.length) {
      return res.status(404).json({
        error: "Bundle not found or inactive",
        message: `Bundle with ID ${id} was not found or is not active`,
      });
    }

    const bundle = bundles[0];

    console.log(
      `Found bundle: ${bundle.title} with ${bundle.items?.length || 0} items`
    );

    // Log pricing information for debugging
    // Replace the logging section with this safer version:
    bundle.items.forEach((item) => {
      if (item) {
        console.log(`Item: ${item.product?.title || "No product associated"}`);
        if (item.product?.variants) {
          item.product.variants.forEach((variant) => {
            console.log(
              `  Variant: ${variant.title}, Price: ${variant.calculated_price?.calculated_amount || "No price"}`
            );
          });
        }
      }
    });

    res.json({
      bundle,
    });
  } catch (error) {
    console.error("Error fetching bundle by ID:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({
        error: "Bundle not found",
        details: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to fetch bundle",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
