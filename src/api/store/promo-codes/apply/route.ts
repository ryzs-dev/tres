import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  createPromotionsWorkflow,
  updateCartPromotionsWorkflow,
} from "@medusajs/medusa/core-flows";
import { PromotionActions } from "@medusajs/framework/utils";
import { PROMO_CODE_MODULE } from "../../../../modules/promo-code";
import PromoCodeService from "../../../../modules/promo-code/service";

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { code, cart_id, customer_email } = req.body as {
    code: string;
    cart_id: string;
    customer_email?: string;
  };

  if (!code || !cart_id) {
    res.status(400).json({
      error: "Promo code and cart ID are required",
    });
    return;
  }

  if (customer_email && typeof customer_email !== "string") {
    return;
  }

  try {
    // Validate the code first
    // @ts-ignore
    const promoCodeService = req.scope.resolve(
      PROMO_CODE_MODULE
    ) as PromoCodeService;
    const promoCode = await promoCodeService.validateCode(code, customer_email);

    // Create the promotion
    await createPromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [
          {
            code: code,
            type: "standard",
            status: "active",
            is_automatic: false,
            application_method: {
              type: "percentage",
              target_type: "items",
              allocation: "across",
              value: promoCode.discount_value,
              currency_code: "myr",
            },
          },
        ],
      },
    });

    // Apply the promotion to the cart
    await updateCartPromotionsWorkflow(req.scope).run({
      input: {
        cart_id: cart_id,
        promo_codes: [code],
        action: PromotionActions.ADD,
      },
    });

    // Mark as used
    await promoCodeService.useCode(code);

    res.json({
      success: true,
      message: "Promo code applied successfully",
      discount: {
        type: promoCode.discount_type,
        value: promoCode.discount_value,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}
