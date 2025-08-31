import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cartId = req.params.id;

    // Get items from request body directly since validatedBody is undefined
    const body = req.body as {
      items?: Array<{
        id: string;
        unit_price: number;
        metadata: Record<string, any>;
      }>;
    };

    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: "Invalid request: items array is required",
      });
    }

    console.log(`🔄 Restoring bundle discounts for cart ${cartId}`);

    const cartModuleService = req.scope.resolve("cart");

    // Update each item's price directly using the cart module service
    for (const item of items) {
      await cartModuleService.updateLineItems([
        {
          id: item.id,
          unit_price: item.unit_price,
          metadata: item.metadata,
        },
      ]);

      console.log(`✅ Restored item ${item.id} to price ${item.unit_price}`);
    }

    // Get updated cart
    const query = req.scope.resolve("query");
    const { data: updatedCarts } = await query.graph({
      entity: "cart",
      fields: ["id", "total", "subtotal", "items.*", "items.metadata"],
      filters: { id: cartId },
    });

    console.log(`✅ Bundle discounts restored for ${items.length} items`);

    res.json({
      success: true,
      cart: updatedCarts[0],
      restoredItems: items.length,
    });
  } catch (error) {
    console.error("❌ Error restoring bundle discounts:", error);
    res.status(500).json({
      error: "Failed to restore bundle discounts",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
