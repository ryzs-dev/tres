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

    const { data: flexibleBundles, metadata: { count, take, skip } = {} } =
      await query.graph({
        entity: "bundle",
        ...req.queryConfig,
      });

    res.json({
      flexible_bundles: flexibleBundles,
      count: count || 0,
      limit: take || 15,
      offset: skip || 0,
    });
  } catch (error) {
    console.error("Error fetching flexible bundles:", error);
    res.status(500).json({
      error: "Failed to fetch flexible bundles",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
