import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { recalculateBundleDiscountsWorkflow } from "../../../../../workflows/recalculate-bundle-discounts";

const RecalculateDiscountsSchema = z.object({
  bundle_id: z.string().optional(),
});

type RecalculateDiscountsSchema = z.infer<typeof RecalculateDiscountsSchema>;

export async function POST(
  req: MedusaRequest<RecalculateDiscountsSchema>,
  res: MedusaResponse
) {
  try {
    const cartId = req.params.id;
    const { bundle_id } = req.validatedBody || {};

    console.log(`🔄 Recalculating bundle discounts for cart ${cartId}`, {
      specific_bundle: bundle_id || "all bundles",
    });

    const { result } = await recalculateBundleDiscountsWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        bundle_id: bundle_id,
      },
    });

    res.json({
      success: true,
      message: bundle_id
        ? `Bundle ${bundle_id} discounts recalculated`
        : "All bundle discounts recalculated",
      results: result,
    });
  } catch (error) {
    console.error("Error recalculating bundle discounts:", error);
    res.status(500).json({
      error: "Failed to recalculate bundle discounts",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
