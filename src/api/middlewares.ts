import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { PostFlexibleBundleSchema } from "./admin/bundled-products/route";
import { PostFlexibleBundleToCartSchema } from "./store/carts/[id]/flexible-bundle-items/route";
import { z } from "zod";

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
            "discount_2_items",
            "discount_3_items",
            "items.*",
            "items.product.*",
          ],
          isList: true,
          defaultLimit: 15,
        }),
      ],
    },
    // Individual bundle routes (GET by ID and DELETE)
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
            "discount_2_items",
            "discount_3_items",
            "items.*",
            "items.product.*",
            "items.product.variants.*",
          ],
        }),
      ],
    },
    {
      matcher: "/admin/bundled-products/:id",
      methods: ["DELETE"],
      middlewares: [
        // No body validation needed for DELETE, just URL params
      ],
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
            "discount_2_items",
            "discount_3_items",
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
            "discount_2_items",
            "discount_3_items",
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
            "discount_2_items",
            "discount_3_items",
            "items.*",
            "items.product.*",
            "items.product.variants.*",
          ],
        }),
      ],
    },

    // Cart bundle items routes - Customer cart operations
    {
      matcher: "/store/carts/:id/flexible-bundle-items",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostFlexibleBundleToCartSchema)],
    },
    {
      matcher: "/store/carts/:id/flexible-bundle-items/:bundle_id",
      methods: ["DELETE"],
      middlewares: [
        // No body validation needed for DELETE, uses URL params and query params
      ],
    },
  ],
});
