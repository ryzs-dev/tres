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

  console.log("Received promo code application request:", {
    code,
    cart_id,
    customer_email,
  });

  if (!code || !cart_id) {
    res.status(400).json({
      success: false,
      error: "Promo code and cart ID are required.",
    });
    return;
  }

  try {
    // Resolve promo code service
    // @ts-ignore
    const promoCodeService = req.scope.resolve(
      PROMO_CODE_MODULE
    ) as PromoCodeService;

    // Validate the code
    const promoCode = await promoCodeService.validateCode(code, customer_email);

    // Create promotion if needed
    await createPromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [
          {
            code,
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

    // Apply promotion to the cart
    await updateCartPromotionsWorkflow(req.scope).run({
      input: {
        cart_id,
        promo_codes: [code],
        action: PromotionActions.ADD,
      },
    });

    // Retrieve updated cart
    const cartService = req.scope.resolve("cart");
    const updatedCart = await cartService.retrieveCart(cart_id, {
      relations: ["items", "discounts", "discounts.rule"],
    });

    // Optional: mark code as used
    // await promoCodeService.useCode(code);

    res.json({
      success: true,
      message: "Promo code applied successfully.",
      discount: {
        type: promoCode.discount_type,
        value: promoCode.discount_value,
      },
      cart: updatedCart,
    });
  } catch (error: any) {
    console.error("Error applying promo code:", error);

    res.status(400).json({
      success: false,
      error: error.message || "Failed to apply promo code.",
    });
  }
}
