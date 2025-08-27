import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { PROMO_CODE_MODULE } from "../../../../modules/promo-code";

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { code, customer_email }: { code: string; customer_email: string } =
    req.body as { code: string; customer_email: string };

  if (!code || !customer_email) {
    res.status(400).json({
      error: "Promo code is required",
    });
    return;
  }

  try {
    const promoCodeService = req.scope.resolve(PROMO_CODE_MODULE);
    const promoCode = await promoCodeService.validateCode(code, customer_email);

    res.json({
      valid: true,
      promo_code: {
        code: promoCode.code,
        discount_type: promoCode.discount_type,
        discount_value: promoCode.discount_value,
        expires_at: promoCode.expires_at,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      valid: false,
      error: error.message,
    });
  }
}
