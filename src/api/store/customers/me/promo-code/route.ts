import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { PROMO_CODE_MODULE } from "../../../../../modules/promo-code";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const customerId = req.user?.customer_id;

  if (!customerId) {
    res.status(401).json({
      error: "Customer not authenticated",
    });
    return;
  }

  try {
    const promoCodeService = req.scope.resolve(PROMO_CODE_MODULE);
    const promoCode = await promoCodeService.getCustomerCode(customerId);

    if (!promoCode) {
      res.json({
        promo_code: null,
        message: "No active promo code found",
      });
      return;
    }

    res.json({
      promo_code: {
        code: promoCode.code,
        discount_type: promoCode.discount_type,
        discount_value: promoCode.discount_value,
        expires_at: promoCode.expires_at,
        is_used: promoCode.is_used,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
}
