// src/api/admin/bundled-products/[id]/route.ts - FIXED WITH BETTER ERROR HANDLING
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { deleteBundleWorkflow } from "../../../../workflows/delete-bundle";
import { updateFlexibleBundleWorkflow } from "../../../../workflows/update-flexible-bundle";

export async function PUT(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params;

  try {
    console.log("🔧 PUT request for bundle:", id);
    console.log(
      "📥 Raw validatedBody:",
      JSON.stringify(req.validatedBody, null, 2)
    );

    // Clean the validated body - remove any undefined values and items array
    const { items, ...bundleUpdateData } = req.validatedBody as any;

    console.log(
      "📦 Bundle update data (without items):",
      JSON.stringify(bundleUpdateData, null, 2)
    );
    console.log("🎯 Items data:", JSON.stringify(items, null, 2));

    const { result: updatedBundle } = await updateFlexibleBundleWorkflow(
      req.scope
    ).run({
      input: {
        bundle_id: id,
        update_data: bundleUpdateData, // Use the clean bundle data without items
      },
    });

    console.log("✅ Bundle updated successfully");

    res.json({
      bundle: updatedBundle,
      message: "Bundle updated successfully",
    });
  } catch (error) {
    console.error("❌ Detailed error updating bundle:");
    console.error(
      "   Error message:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(
      "   Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("   Full error object:", error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return res.status(404).json({
          error: "Bundle not found",
          details: error.message,
        });
      }

      if (error.message.includes("validation")) {
        return res.status(400).json({
          error: "Validation error",
          details: error.message,
        });
      }
    }

    res.status(500).json({
      error: "Failed to update bundle",
      details: error instanceof Error ? error.message : "Unknown error",
      // Add more debug info in development
      debug: {
        bundle_id: id,
        update_data: req.validatedBody,
        error_type:
          error instanceof Error ? error.constructor.name : typeof error,
      },
    });
  }
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params;

  try {
    await deleteBundleWorkflow(req.scope).run({
      input: {
        bundle_id: id,
      },
    });

    res.json({
      message: "Bundle deleted successfully",
      deleted: true,
    });
  } catch (error) {
    console.error("Error deleting bundle:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({
        error: "Bundle not found",
        details: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to delete bundle",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params;

  try {
    const query = req.scope.resolve("query");

    const { data: bundles } = await query.graph({
      entity: "bundle",
      fields: [
        "*",
        "items.*",
        "items.product.*",
        "items.product.variants.*",
        "discount_type",
        "discount_2_items",
        "discount_3_items",
        "discount_2_items_amount",
        "discount_3_items_amount",
      ],
      filters: { id },
    });

    if (!bundles?.length) {
      return res.status(404).json({
        error: "Bundle not found",
      });
    }

    res.json({
      bundle: bundles[0],
    });
  } catch (error) {
    console.error("Error fetching bundle:", error);

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
