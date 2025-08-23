export interface BundleDiscountStatus {
  bundleId: string;
  bundleTitle: string;
  currentItemCount: number;
  requiredForDiscount: number;
  currentDiscount: {
    type: "none" | "percentage" | "fixed";
    value?: number;
    displayText: string;
  };
  potentialDiscount?: {
    type: "percentage" | "fixed";
    value: number;
    displayText: string;
    itemsNeeded: number;
  };
}

export async function getBundleDiscountStatus(
  cartId: string,
  query: any
): Promise<BundleDiscountStatus[]> {
  try {
    // Get all cart items
    const { data: cartItems } = await query.graph({
      entity: "cart_item",
      fields: ["*", "metadata", "variant.*"],
      filters: { cart_id: cartId },
    });

    // Group by bundle
    const bundleGroups = new Map<string, any[]>();
    cartItems?.forEach((item: any) => {
      if (item.metadata?.is_from_bundle && item.metadata?.bundle_id) {
        const bundleId = item.metadata.bundle_id;
        if (!bundleGroups.has(bundleId)) {
          bundleGroups.set(bundleId, []);
        }
        bundleGroups.get(bundleId)!.push(item);
      }
    });

    const statuses: BundleDiscountStatus[] = [];

    for (const [bundleId, items] of bundleGroups) {
      // Get bundle configuration
      const { data: bundles } = await query.graph({
        entity: "bundle",
        fields: [
          "id",
          "title",
          "discount_type",
          "discount_2_items",
          "discount_3_items",
          "discount_2_items_amount",
          "discount_3_items_amount",
        ],
        filters: { id: bundleId },
      });

      const bundle = bundles?.[0];
      if (!bundle) continue;

      const currentItemCount = items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Determine current discount
      const currentDiscount = getCurrentBundleDiscount(
        currentItemCount,
        bundle
      );

      // Determine potential discount (next tier)
      const potentialDiscount = getNextBundleDiscount(currentItemCount, bundle);

      statuses.push({
        bundleId,
        bundleTitle: bundle.title,
        currentItemCount,
        requiredForDiscount: getMinimumItemsForDiscount(bundle),
        currentDiscount,
        potentialDiscount,
      });
    }

    return statuses;
  } catch (error) {
    console.error("Error getting bundle discount status:", error);
    return [];
  }
}

function getCurrentBundleDiscount(itemCount: number, bundle: any) {
  // Check fixed discounts
  if (
    bundle.discount_type === "fixed" ||
    bundle.discount_2_items_amount ||
    bundle.discount_3_items_amount
  ) {
    if (itemCount === 2 && bundle.discount_2_items_amount) {
      return {
        type: "fixed" as const,
        value: bundle.discount_2_items_amount,
        displayText: `RM${(bundle.discount_2_items_amount / 100).toFixed(2)} off`,
      };
    }
    if (itemCount >= 3 && bundle.discount_3_items_amount) {
      return {
        type: "fixed" as const,
        value: bundle.discount_3_items_amount,
        displayText: `RM${(bundle.discount_3_items_amount / 100).toFixed(2)} off`,
      };
    }
  }

  // Check percentage discounts
  if (
    bundle.discount_type === "percentage" ||
    bundle.discount_2_items ||
    bundle.discount_3_items
  ) {
    if (itemCount === 2 && bundle.discount_2_items) {
      return {
        type: "percentage" as const,
        value: bundle.discount_2_items,
        displayText: `${bundle.discount_2_items}% off`,
      };
    }
    if (itemCount >= 3 && bundle.discount_3_items) {
      return {
        type: "percentage" as const,
        value: bundle.discount_3_items,
        displayText: `${bundle.discount_3_items}% off`,
      };
    }
  }

  return {
    type: "none" as const,
    displayText: "No discount",
  };
}

function getNextBundleDiscount(currentItemCount: number, bundle: any) {
  // If currently has no discount and can get 2-item discount
  if (currentItemCount < 2) {
    if (bundle.discount_2_items_amount) {
      return {
        type: "fixed" as const,
        value: bundle.discount_2_items_amount,
        displayText: `RM${(bundle.discount_2_items_amount / 100).toFixed(2)} off`,
        itemsNeeded: 2 - currentItemCount,
      };
    }
    if (bundle.discount_2_items) {
      return {
        type: "percentage" as const,
        value: bundle.discount_2_items,
        displayText: `${bundle.discount_2_items}% off`,
        itemsNeeded: 2 - currentItemCount,
      };
    }
  }

  // If currently has 2-item discount and can get 3-item discount
  if (currentItemCount === 2) {
    if (bundle.discount_3_items_amount) {
      return {
        type: "fixed" as const,
        value: bundle.discount_3_items_amount,
        displayText: `RM${(bundle.discount_3_items_amount / 100).toFixed(2)} off`,
        itemsNeeded: 1,
      };
    }
    if (bundle.discount_3_items) {
      return {
        type: "percentage" as const,
        value: bundle.discount_3_items,
        displayText: `${bundle.discount_3_items}% off`,
        itemsNeeded: 1,
      };
    }
  }

  return undefined;
}

function getMinimumItemsForDiscount(bundle: any): number {
  if (bundle.discount_2_items || bundle.discount_2_items_amount) {
    return 2;
  }
  if (bundle.discount_3_items || bundle.discount_3_items_amount) {
    return 3;
  }
  return 1;
}
