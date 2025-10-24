// Update your DELETE route in: src/api/store/carts/[id]/flexible-bundle-items/route.ts

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { addFlexibleBundleToCartWorkflow } from "../../../../../workflows/add-flexible-bundle-to-cart";
import { removeFlexibleBundleFromCartWorkflow } from "../../../../../workflows/remove-flexible-bundle-from-cart";
import { updateFlexibleBundleInCartWorkflow } from "../../../../../workflows/update-flexible-bundle-in-cart";
import { removeItemFromBundleWorkflow } from "../../../../../workflows/remove-item-from-bundle";

export const PostFlexibleBundleToCartSchema = z.object({
  bundle_id: z.string(),
  selectedItems: z
    .array(
      z.object({
        item_id: z.string(),
        variant_id: z.string(),
        quantity: z.number().optional().default(1),
      })
    )
    .min(1, "At least one item must be selected"),
});

export const PatchFlexibleBundleInCartSchema = z.object({
  bundle_id: z.string(),
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

type PostFlexibleBundleToCartSchema = z.infer<
  typeof PostFlexibleBundleToCartSchema
>;

export async function POST(
  req: MedusaRequest<PostFlexibleBundleToCartSchema>,
  res: MedusaResponse
) {
  try {
    const { result: cart } = await addFlexibleBundleToCartWorkflow(
      req.scope
    ).run({
      input: {
        cart_id: req.params.id,
        bundle_id: req.validatedBody.bundle_id,
        selectedItems: req.validatedBody.selectedItems,
      },
    });

    res.status(200).json({
      cart,
      message: "Flexible bundle items added successfully with discount applied",
    });
  } catch (error) {
    console.error("Error in POST flexible bundle:", error);
    res.status(500).json({
      error: "Failed to add flexible bundle to cart",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

type PatchFlexibleBundleInCartSchema = z.infer<
  typeof PatchFlexibleBundleInCartSchema
>;

export async function PATCH(
  req: MedusaRequest<PatchFlexibleBundleInCartSchema>,
  res: MedusaResponse
) {
  try {
    const cartId = req.params.id;

    // Manually validate and parse the request body since validatedBody is undefined
    let selectedItems: {
      item_id: string;
      variant_id: string;
      quantity?: number;
    }[] = [];

    const { result: cart } = await updateFlexibleBundleInCartWorkflow(
      req.scope
    ).run({
      input: {
        cart_id: cartId,
        bundle_id: req.validatedBody.bundle_id,
        selectedItems: req.validatedBody.selectedItems, // This matches the cart workflow input
      },
    });

    const action = selectedItems.length === 0 ? "removed" : "updated";
    const message =
      selectedItems.length === 0
        ? "Bundle removed from cart successfully"
        : "Bundle updated successfully with new discount calculations";

    res.json({
      cart,
      bundle_id: req.validatedBody.bundle_id,
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

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cartId = req.params.id;
    const { bundle_id, item_id } = req.body as {
      bundle_id: string;
      item_id: string;
      cart_id: string;
    };

    if (!item_id) {
      return res.status(400).json({
        error: "item_id is required as query body to remove item from bundle",
      });
    }

    const { result: cart } = await removeItemFromBundleWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        bundle_id: bundle_id,
        item_id: item_id,
      },
    });

    res.json({
      cart,
      message: "Item removed from bundle successfully",
    });
  } catch (error) {
    console.error("Error removing from bundle:", error);
    res.status(500).json({
      error: "Failed to remove from bundle",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
