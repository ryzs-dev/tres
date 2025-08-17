// src/api/admin/bundles/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createFlexibleBundleWorkflow } from "../../../workflows/create-flexible-bundle";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { bundle } = req.body as {
      bundle: {
        title: string;
        items: any[];
        discount_type?: "fixed" | "percentage";
        discount_2_items_amount?: number;
        discount_3_items_amount?: number;
        discount_2_items?: number;
        discount_3_items?: number;
      };
    };

    // Validate required fields
    if (!bundle.title) {
      return res.status(400).json({
        error: "Bundle title is required",
      });
    }

    if (!bundle.items || bundle.items.length === 0) {
      return res.status(400).json({
        error: "Bundle must contain at least one item",
      });
    }

    // Validate discount configuration
    if (bundle.discount_type === "fixed") {
      // Validate fixed discount amounts
      if (
        bundle.discount_2_items_amount &&
        bundle.discount_2_items_amount < 0
      ) {
        return res.status(400).json({
          error: "Discount amounts must be positive",
        });
      }
      if (
        bundle.discount_3_items_amount &&
        bundle.discount_3_items_amount < 0
      ) {
        return res.status(400).json({
          error: "Discount amounts must be positive",
        });
      }
    } else if (bundle.discount_type === "percentage") {
      // Validate percentage discounts
      if (
        bundle.discount_2_items &&
        (bundle.discount_2_items < 0 || bundle.discount_2_items > 100)
      ) {
        return res.status(400).json({
          error: "Percentage discounts must be between 0 and 100",
        });
      }
      if (
        bundle.discount_3_items &&
        (bundle.discount_3_items < 0 || bundle.discount_3_items > 100)
      ) {
        return res.status(400).json({
          error: "Percentage discounts must be between 0 and 100",
        });
      }
    }

    console.log("🚀 Creating bundle via API:", {
      title: bundle.title,
      discount_type: bundle.discount_type,
      discount_2_items_amount: bundle.discount_2_items_amount,
      discount_3_items_amount: bundle.discount_3_items_amount,
      items_count: bundle.items.length,
    });

    // Execute the workflow
    const { result: createdBundle } = await createFlexibleBundleWorkflow(
      req.scope
    ).run({
      input: { bundle },
    });

    console.log("✅ Bundle created successfully:", createdBundle.id);

    return res.status(201).json({
      bundle: createdBundle,
      message: "Bundle created successfully",
    });
  } catch (error) {
    console.error("❌ Error creating bundle:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

// Example usage with curl:
/*
curl -X POST http://localhost:9000/admin/bundles \
  -H "Content-Type: application/json" \
  -d '{
    "bundle": {
      "title": "Summer Bundle",
      "description": "Great summer deals",
      "discount_type": "fixed",
      "discount_2_items_amount": 2000,
      "discount_3_items_amount": 3000,
      "min_items": 1,
      "max_items": 5,
      "items": [
        {
          "product_id": "prod_123",
          "quantity": 1
        },
        {
          "product_id": "prod_456", 
          "quantity": 1
        }
      ]
    }
  }'
*/
