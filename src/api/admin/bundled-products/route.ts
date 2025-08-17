// src/api/admin/bundled-products/route.ts - FIXED POST SCHEMA
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { z } from "zod";
import {
  createFlexibleBundleWorkflow,
  CreateFlexibleBundleWorkflowInput,
} from "../../../workflows/create-flexible-bundle";

// FIXED: Use nullable() to allow null values for discount fields
export const PostFlexibleBundleSchema = z.object({
  title: z.string(),
  handle: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  min_items: z.number().optional().default(1),
  max_items: z.number().nullable().optional(),
  selection_type: z
    .enum(["flexible", "required_all"])
    .optional()
    .default("flexible"),

  // FIXED: Use nullable() to properly handle null values
  discount_type: z
    .enum(["percentage", "fixed"])
    .nullable()
    .optional()
    .default("percentage"),
  discount_2_items: z.number().min(0).max(100).nullable().optional(),
  discount_3_items: z.number().min(0).max(100).nullable().optional(),
  discount_2_items_amount: z.number().min(0).nullable().optional(),
  discount_3_items_amount: z.number().min(0).nullable().optional(),

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
    console.log("📥 Received bundle data:", req.validatedBody);

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
        "discount_type",
        "discount_2_items",
        "discount_3_items",
        "discount_2_items_amount",
        "discount_3_items_amount",
        "created_at",
        "updated_at",
        "items.*",
        "items.product_id",
        "items.quantity",
        "items.is_optional",
        "items.sort_order",
      ],
      pagination: {
        take: parseInt(req.query.limit as string) || 15,
        skip: parseInt(req.query.offset as string) || 0,
      },
    });

    // Fetch product information for each bundle item
    const bundlesWithProducts = await Promise.all(
      (bundles || []).map(async (bundle) => {
        if (!bundle.items || bundle.items.length === 0) {
          return { ...bundle, items: [] };
        }

        const itemsWithProducts = await Promise.all(
          bundle.items.map(async (item) => {
            if (!item?.product_id) return item;

            try {
              const { data: products } = await query.graph({
                entity: "product",
                fields: ["id", "title", "status"],
                filters: { id: item.product_id },
              });

              return {
                ...item,
                product: products?.[0] || {
                  id: item?.product_id,
                  title: "Unknown Product",
                  status: "draft",
                },
              };
            } catch (error) {
              console.error(
                `Error fetching product ${item?.product_id}:`,
                error
              );
              return {
                ...item,
                product: {
                  id: item?.product_id,
                  title: "Unknown Product",
                  status: "draft",
                },
              };
            }
          })
        );

        return { ...bundle, items: itemsWithProducts };
      })
    );

    console.log(
      `📊 Query returned ${bundlesWithProducts?.length || 0} bundles`
    );

    const response = {
      flexible_bundles: bundlesWithProducts || [],
      count: metadata?.count || bundlesWithProducts?.length || 0,
      limit: parseInt(req.query.limit as string) || 15,
      offset: parseInt(req.query.offset as string) || 0,
    };

    console.log("📤 Sending response structure:", {
      flexible_bundles_count: response.flexible_bundles.length,
      total_count: response.count,
      limit: response.limit,
      offset: response.offset,
    });

    res.json(response);
  } catch (error) {
    console.error("🚨 Error fetching flexible bundles:", error);
    res.status(500).json({
      error: "Failed to fetch flexible bundles",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
