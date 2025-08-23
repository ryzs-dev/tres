// src/workflows/recalculate-bundle-discounts.ts
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { recalculateBundleDiscountsStep } from "./steps/recalculate-bundle-discounts";

type RecalculateBundleDiscountsWorkflowInput = {
  cart_id: string;
  bundle_id?: string; // Optional: recalculate specific bundle only
};

export const recalculateBundleDiscountsWorkflow = createWorkflow(
  "recalculate-bundle-discounts",
  (input: RecalculateBundleDiscountsWorkflowInput) => {
    const { cart_id, bundle_id } = input;

    // Get current cart state
    //   @ts-ignore
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      fields: [
        "id",
        "items.*",
        "items.metadata",
        "items.variant.*",
        "items.variant.prices.*",
      ],
      filters: {
        id: cart_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "get-cart-for-recalculation" });

    // Recalculate bundle discounts
    const recalculationResult = recalculateBundleDiscountsStep({
      cart: cartQuery.data[0],
      specific_bundle_id: bundle_id,
    });

    return new WorkflowResponse(recalculationResult);
  }
);
