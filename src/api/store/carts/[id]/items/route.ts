import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { addToCartWorkflow } from "@medusajs/medusa/core-flows";
import { recalculateBundleDiscountsWorkflow } from "../../../../../workflows/recalculate-bundle-discounts";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cartId = req.params.id;

    console.log(`➕ Adding items to cart ${cartId}`);

    // Add items to cart
    const { result: cart } = await addToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        items: (req.validatedBody as { items: any[] }).items,
      },
    });

    // Check if any added items might affect existing bundles
    // This handles cases where users manually add products that are part of existing bundles
    try {
      console.log(`🔄 Checking if bundle discounts need recalculation...`);

      await recalculateBundleDiscountsWorkflow(req.scope).run({
        input: {
          cart_id: cartId,
          // No specific bundle_id = recalculate all bundles
        },
      });

      console.log(`✅ All bundle discounts verified/recalculated`);
    } catch (recalcError) {
      console.error("⚠️ Failed to recalculate bundle discounts:", recalcError);
      // Don't fail the main operation
    }

    res.json({ cart });
  } catch (error) {
    console.error("Error adding items to cart:", error);
    res.status(500).json({
      error: "Failed to add items to cart",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
