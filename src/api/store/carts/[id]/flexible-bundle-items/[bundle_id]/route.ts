// src/api/store/carts/[id]/flexible-bundle-items/[bundle_id]/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { removeFlexibleBundleFromCartWorkflow } from "../../../../../../workflows/remove-flexible-bundle-from-cart";

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id: cart_id, bundle_id } = req.params;

  console.log("=== REMOVING BUNDLE FROM CART ===");
  console.log("Cart ID:", cart_id);
  console.log("Bundle ID:", bundle_id);

  try {
    const { result: cart } = await removeFlexibleBundleFromCartWorkflow(
      req.scope
    ).run({
      input: {
        cart_id,
        bundle_id,
      },
    });

    console.log("Successfully removed bundle items from cart");

    res.json({
      cart,
      message: "Bundle items removed successfully",
    });
  } catch (error) {
    console.error("Error removing bundle from cart:", error);
    res.status(500).json({
      error: "Failed to remove bundle from cart",
      message: error.message,
    });
  }
}
