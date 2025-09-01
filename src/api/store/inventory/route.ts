import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getVariantAvailability } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { variant_id, sales_channel_id } = req.query;

    if (!variant_id) {
      return res.status(400).json({ error: "variant_id is required" });
    }

    // fallback to your fixed sales channel if not provided
    const channelId = sales_channel_id || "sc_01JQ41G40QHMRTH269SSZ8XAHB";

    // get the query service from the request scope
    const query = req.scope.resolve("query");

    const availability = await getVariantAvailability(query, {
      variant_ids: [variant_id as string],
      sales_channel_id: channelId as string,
    });

    return res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("❌ Error fetching availability:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch variant availability",
    });
  }
};
