import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { z } from "zod";
import { BUNDLE_MODULE } from "../../../modules/bundle";
import BundleModuleService from "../../../modules/bundle/service";

const CreateBundleSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  bundle_type: z.enum(["fixed", "pick_any", "pick_x_from_y"]),
  items_to_pick: z.number().nullable().optional(),
  pricing_type: z.enum(["sum_prices", "fixed_price", "percentage_off"]),
  fixed_price: z.number().nullable().optional(),
  discount_percentage: z.number().nullable().optional(),
  is_active: z.boolean().default(true),
  items: z.array(
    z.object({
      product_id: z.string(),
      default_quantity: z.number().default(1),
      is_required: z.boolean().default(false),
      sort_order: z.number().default(0),
      custom_price: z.number().nullable().optional(),
      item_discount: z.number().nullable().optional(),
    })
  ),
});

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const validatedBody = CreateBundleSchema.parse(req.body);

  const bundleService: BundleModuleService = req.scope.resolve(BUNDLE_MODULE);

  // Create bundle
  const bundle = await bundleService.createBundles({
    title: validatedBody.title,
    description: validatedBody.description,
    bundle_type: validatedBody.bundle_type,
    items_to_pick: validatedBody.items_to_pick,
    pricing_type: validatedBody.pricing_type,
    fixed_price: validatedBody.fixed_price,
    discount_percentage: validatedBody.discount_percentage,
    is_active: validatedBody.is_active,
  });

  // Create bundle items
  if (validatedBody.items.length > 0) {
    await bundleService.createBundleItems(
      validatedBody.items.map((item) => ({
        bundle_id: bundle.id,
        product_id: item.product_id,
        default_quantity: item.default_quantity,
        is_required: item.is_required,
        sort_order: item.sort_order,
        custom_price: item.custom_price,
        item_discount: item.item_discount,
      }))
    );
  }

  res.json({ bundle });
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve("query");

  const { data: bundles, metadata } = await query.graph({
    entity: "bundle",
    ...req.queryConfig,
  });

  res.json({
    bundles,
    count: metadata?.count || 0,
    limit: metadata?.take || 15,
    offset: metadata?.skip || 0,
  });
}
