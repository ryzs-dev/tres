import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { z } from "zod";
import {
  createFlexibleBundleWorkflow,
  CreateFlexibleBundleWorkflowInput,
} from "../../../workflows/create-flexible-bundle";

export const PostFlexibleBundleSchema = z.object({
  title: z.string(),
  handle: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  min_items: z.number().optional().default(1),
  max_items: z.number().optional(),
  selection_type: z
    .enum(["flexible", "required_all"])
    .optional()
    .default("flexible"),
  // Add discount fields
  discount_2_items: z.number().min(0).max(100).optional(),
  discount_3_items: z.number().min(0).max(100).optional(),
  items: z
    .array(
      z.object({
        product_id: z.string(),
        quantity: z.number().min(1),
        is_optional: z.boolean().optional().default(true),
        sort_order: z.number().optional(),
      })
    )
    .min(1, "At least one item is required"),
});

type PostFlexibleBundleSchema = z.infer<typeof PostFlexibleBundleSchema>;

export async function POST(
  req: AuthenticatedMedusaRequest<PostFlexibleBundleSchema>,
  res: MedusaResponse
) {
  try {
    const { result: flexibleBundle } = await createFlexibleBundleWorkflow(
      req.scope
    ).run({
      input: {
        bundle: req.validatedBody,
      } as CreateFlexibleBundleWorkflowInput,
    });

    res.json({
      flexible_bundle: flexibleBundle,
      message: "Flexible bundle created successfully",
    });
  } catch (error) {
    console.error("Error creating flexible bundle:", error);
    res.status(500).json({
      error: "Failed to create flexible bundle",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  try {
    const query = req.scope.resolve("query");

    console.log("🔍 GET /admin/bundled-products called");
    console.log("📋 Query params:", req.query);

    // FIXED: More explicit query with all needed fields
    const { data: bundles, metadata } = await query.graph({
      entity: "bundle",
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "is_active",
        "min_items",
        "max_items",
        "selection_type",
        "discount_2_items", // Make sure these are included
        "discount_3_items", // Make sure these are included
        "created_at",
        "updated_at",
        "items.*",
        "items.product.*",
        "items.product.title",
        "items.quantity",
        "items.is_optional",
        "items.sort_order",
      ],
      filters: {
        // Optionally filter by active status or remove to show all
        // is_active: true,
      },
      pagination: {
        take: parseInt(req.query.limit as string) || 15,
        skip: parseInt(req.query.offset as string) || 0,
      },
    });

    console.log(`📊 Found ${bundles?.length || 0} bundles`);
    console.log("🎯 Sample bundle:", bundles?.[0]);

    // FIXED: Make sure response format matches what frontend expects
    const response = {
      flexible_bundles: bundles || [], // Use "flexible_bundles" key to match frontend
      count: metadata?.count || bundles?.length || 0,
      limit: parseInt(req.query.limit as string) || 15,
      offset: parseInt(req.query.offset as string) || 0,
    };

    console.log("📤 Sending response:", response);

    res.json(response);
  } catch (error) {
    console.error("🚨 Error fetching flexible bundles:", error);
    res.status(500).json({
      error: "Failed to fetch flexible bundles",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
