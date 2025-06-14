// src/api/admin/bundled-products/[id]/route.ts
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { deleteBundleWorkflow } from "../../../../workflows/delete-bundle";

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
      fields: ["*", "items.*", "items.product.*", "items.product.variants.*"],
      filters: { id },
    });

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
