// import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
// import {
//   updateLineItemInCartWorkflow,
//   deleteLineItemsWorkflow,
// } from "@medusajs/medusa/core-flows";
// import { recalculateBundleDiscountsWorkflow } from "../../../../../../workflows/recalculate-bundle-discounts";

// // Enhanced PATCH - Update item quantity and recalculate bundle discounts
// export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
//   try {
//     const cartId = req.params.id;
//     const itemId = req.params.item_id;

//     console.log(`📝 Updating cart item ${itemId} in cart ${cartId}`);

//     // First, get the item to check if it's from a bundle
//     const query = req.scope.resolve("query");
//     const { data: items } = await query.graph({
//       entity: "cart_item",
//       fields: ["*", "metadata"],
//       filters: { id: itemId },
//     });

//     const item = items?.[0];
//     const isFromBundle = item?.metadata?.is_from_bundle;
//     const bundleId = item?.metadata?.bundle_id;

//     // Delete the item
//     const { result: cart } = await deleteLineItemsWorkflow(req.scope).run({
//       input: {
//         cart_id: cartId,
//         line_item_ids: [itemId],
//       },
//     });

//     // If item was from a bundle, recalculate bundle discounts
//     if (isFromBundle && bundleId) {
//       console.log(
//         `🔄 Removed item was from bundle ${bundleId} - recalculating discounts`
//       );

//       try {
//         await recalculateBundleDiscountsWorkflow(req.scope).run({
//           input: {
//             cart_id: cartId,
//             bundle_id: bundleId, // Only recalculate this specific bundle
//           },
//         });
//         console.log(`✅ Bundle discounts recalculated for bundle ${bundleId}`);
//       } catch (recalcError) {
//         console.error(
//           "⚠️ Failed to recalculate bundle discounts:",
//           recalcError
//         );
//         // Don't fail the main operation, just log the error
//       }
//     }

//     res.json({ cart });
//   } catch (error) {
//     console.error("Error removing cart item:", error);
//     res.status(500).json({
//       error: "Failed to remove cart item",
//       details: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// }
