// src/api/middlewares.ts - FIXED SCHEMA
import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";
import { PostFlexibleBundleSchema } from "./admin/bundled-products/route";
import { PostFlexibleBundleToCartSchema } from "./store/carts/[id]/flexible-bundle-items/route";

// FIXED: Update schema for editing bundles with proper null handling
export const UpdateFlexibleBundleSchema = z.object({
  title: z.string().optional(),
  handle: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  min_items: z.number().optional(),
  max_items: z.number().nullable().optional(),
  selection_type: z.enum(["flexible", "required_all"]).optional(),

  // FIXED: Allow null values for discount fields using nullable()
  discount_type: z.enum(["percentage", "fixed"]).nullable().optional(),
  discount_2_items: z.number().min(0).max(100).nullable().optional(),
  discount_3_items: z.number().min(0).max(100).nullable().optional(),
  discount_2_items_amount: z.number().min(0).nullable().optional(),
  discount_3_items_amount: z.number().min(0).nullable().optional(),

  items: z
    .array(
      z.object({
        id: z.string().optional(), // For existing items
        product_id: z.string(),
        quantity: z.number().min(1),
        is_optional: z.boolean().optional().default(true),
        sort_order: z.number().optional(),
      })
    )
    .optional(),
});

// Custom schema for storefront bundle queries with currency/region support
const StorefrontBundleQuery = createFindParams().merge(
  z.object({
    currency_code: z.string().optional(),
    region_id: z.string().optional(),
  })
);

export default defineMiddlewares({
  routes: [
    // Admin routes - Bundle management
    {
      matcher: "/admin/bundled-products",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostFlexibleBundleSchema)],
    },
    {
      matcher: "/admin/bundled-products",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          defaults: [
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
            "items.*",
            "items.product.*",
          ],
          isList: true,
          defaultLimit: 15,
        }),
      ],
    },

    // Individual bundle routes
    {
      matcher: "/admin/bundled-products/:id",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          defaults: [
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
            "items.*",
            "items.product.*",
            "items.product.variants.*",
          ],
        }),
      ],
    },

    // FIXED: PUT route for updating bundles
    {
      matcher: "/admin/bundled-products/:id",
      methods: ["PUT"],
      middlewares: [validateAndTransformBody(UpdateFlexibleBundleSchema)],
    },

    {
      matcher: "/admin/bundled-products/:id",
      methods: ["DELETE"],
      middlewares: [],
    },

    // Storefront routes - Customer-facing bundle endpoints
    {
      matcher: "/store/bundles",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(StorefrontBundleQuery, {
          defaults: [
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
            "items.*",
            "items.product.*",
          ],
          isList: true,
          defaultLimit: 12,
        }),
      ],
    },
    {
      matcher: "/store/bundles/:id",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(StorefrontBundleQuery, {
          defaults: [
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
            "items.*",
            "items.product.*",
            "items.product.variants.*",
          ],
        }),
      ],
    },
    {
      matcher: "/store/bundles/handle/:handle",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(StorefrontBundleQuery, {
          defaults: [
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
            "items.*",
            "items.product.*",
            "items.product.variants.*",
          ],
        }),
      ],
    },

    // Cart bundle items routes
    {
      matcher: "/store/carts/:id/flexible-bundle-items",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostFlexibleBundleToCartSchema)],
    },
    {
      matcher: "/store/carts/:id/flexible-bundle-items/:bundle_id",
      methods: ["DELETE"],
      middlewares: [],
    },
    {
      matcher: "/api/hooks/payment/razorpay/*",
      bodyParser: { preserveRawBody: true },
      method: ["POST"],
    },
  ],
});
