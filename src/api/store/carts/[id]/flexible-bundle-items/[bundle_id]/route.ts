import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { removeFlexibleBundleFromCartWorkflow } from "../../../../../../workflows/remove-flexible-bundle-from-cart";
import { z } from "zod";
import { updateFlexibleBundleInCartWorkflow } from "../../../../../../workflows/update-flexible-bundle-in-cart";
import { removeItemFromBundleWorkflow } from "../../../../../../workflows/remove-item-from-bundle";

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id: cart_id, bundle_id } = req.params;
  const { item_id } = req.query; // Get specific item to remove

  console.log("=== REMOVING FROM BUNDLE ===");
  console.log("Cart ID:", cart_id);
  console.log("Bundle ID:", bundle_id);
  console.log("Item ID to remove:", item_id);

  try {
    if (item_id) {
      // Remove specific item from bundle
      const { result: cart } = await removeItemFromBundleWorkflow(
        req.scope
      ).run({
        input: {
          cart_id,
          bundle_id,
          item_id: item_id as string,
        },
      });

      res.json({
        cart,
        message: "Item removed from bundle successfully",
      });
    } else {
      // Remove entire bundle (your existing logic)
      const { result: cart } = await removeFlexibleBundleFromCartWorkflow(
        req.scope
      ).run({
        input: {
          cart_id,
          bundle_id,
        },
      });

      res.json({
        cart,
        message: "Bundle removed successfully",
      });
    }
  } catch (error) {
    console.error("Error removing from bundle:", error);
    res.status(500).json({
      error: "Failed to remove from bundle",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
export const PatchFlexibleBundleInCartSchema = z.object({
  selectedItems: z
    .array(
      z.object({
        item_id: z.string(),
        variant_id: z.string(),
        quantity: z.number().min(1).optional().default(1),
      })
    )
    .optional()
    .default([]), // Allow empty array to delete bundle
});

type PatchFlexibleBundleInCartSchema = z.infer<
  typeof PatchFlexibleBundleInCartSchema
>;

/**
 * Update bundle in cart - handles three scenarios:
 * 1. Delete bundle: Pass empty selectedItems array
 * 2. Update quantities: Pass same items with different quantities
 * 3. Change items: Pass different items within the bundle
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cartId = req.params.id;
    const bundleId = req.params.bundle_id;

    console.log(`🔄 PATCH: Updating bundle ${bundleId} in cart ${cartId}`);
    console.log("Raw request body:", req.body);

    // Manually validate and parse the request body since validatedBody is undefined
    let selectedItems: {
      item_id: string;
      variant_id: string;
      quantity?: number;
    }[] = [];

    try {
      const validationResult = PatchFlexibleBundleInCartSchema.safeParse(
        req.body
      );

      if (!validationResult.success) {
        console.error("Validation error:", validationResult.error.errors);
        return res.status(400).json({
          error: "Invalid request body",
          details: validationResult.error.errors,
        });
      }

      selectedItems = validationResult.data.selectedItems;
    } catch (parseError) {
      console.error("Body parsing error:", parseError);
      return res.status(400).json({
        error: "Invalid JSON in request body",
        details:
          parseError instanceof Error
            ? parseError.message
            : "Unknown parsing error",
      });
    }

    if (selectedItems.length === 0) {
      console.log("🗑️ Empty selection - removing bundle from cart");
    } else {
      console.log(
        `📝 New selection: ${selectedItems.length} items`,
        selectedItems
      );
    }

    // CORRECTED: Use the cart workflow with correct parameters
    const { result: cart } = await updateFlexibleBundleInCartWorkflow(
      req.scope
    ).run({
      input: {
        cart_id: cartId,
        bundle_id: bundleId,
        selectedItems, // This matches the cart workflow input
      },
    });

    // Determine what action was performed
    const action = selectedItems.length === 0 ? "removed" : "updated";
    const message =
      selectedItems.length === 0
        ? "Bundle removed from cart successfully"
        : "Bundle updated successfully with new discount calculations";

    res.json({
      cart,
      bundle_id: bundleId,
      action,
      items_count: selectedItems.length,
      message,
    });
  } catch (error) {
    console.error("Error updating bundle in cart:", error);
    res.status(500).json({
      error: "Failed to update bundle in cart",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
