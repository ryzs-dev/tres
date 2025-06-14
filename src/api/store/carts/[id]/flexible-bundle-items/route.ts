// Update your DELETE route in: src/api/store/carts/[id]/flexible-bundle-items/route.ts

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { addFlexibleBundleToCartWorkflow } from "../../../../../workflows/add-flexible-bundle-to-cart";
import { removeFlexibleBundleFromCartWorkflow } from "../../../../../workflows/remove-flexible-bundle-from-cart";

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

    res.json({
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

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bundle_id = req.query.bundle_id as string;

    if (!bundle_id) {
      return res.status(400).json({
        error: "bundle_id is required as query parameter",
      });
    }

    // Use the flexible bundle specific workflow
    const { result: cart } = await removeFlexibleBundleFromCartWorkflow(
      req.scope
    ).run({
      input: {
        cart_id: req.params.id,
        bundle_id: bundle_id,
      },
    });

    res.json({
      cart,
      message: "Flexible bundle items removed successfully",
    });
  } catch (error) {
    console.error("Error in DELETE flexible bundle:", error);
    res.status(500).json({
      error: "Failed to remove flexible bundle from cart",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
