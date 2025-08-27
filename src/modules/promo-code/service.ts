// src/modules/promo-code/service.ts
import { MedusaService } from "@medusajs/framework/utils";
import PromoCode from "./models/promo-code";

export default class PromoCodeService extends MedusaService({
  PromoCode,
}) {
  // Generate unique promo code for new customer
  async generateCodeForCustomer(
    customerId: string,
    customerEmail: string
  ): Promise<string> {
    const code = this.generateUniqueCode();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3); // 3 months from now

    await this.createPromoCodes({
      code,
      customer_id: customerId,
      customer_email: customerEmail,
      discount_type: "percentage",
      discount_value: 10, // 10% discount
      expires_at: expiresAt,
    });

    return code;
  }

  // Generate a unique code
  private generateUniqueCode(): string {
    const prefix = "T";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = prefix;

    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  // Validate promo code
  async validateCode(code: string, customerEmail?: string) {
    const promoCodes = await this.listPromoCodes({ code });

    if (!promoCodes.length) {
      throw new Error("Invalid promo code");
    }

    const promo = promoCodes[0];

    // Check if expired
    if (new Date() > new Date(promo.expires_at)) {
      throw new Error("Promo code has expired");
    }

    // Check if already used
    if (promo.is_used) {
      throw new Error("Promo code has already been used");
    }

    // If customer email provided, check if it matches
    if (customerEmail && promo.customer_email !== customerEmail) {
      throw new Error("Promo code is not valid for this customer");
    }

    return promo;
  }

  // Mark code as used
  async useCode(code: string) {
    const promoCodes = await this.listPromoCodes({ code });

    if (!promoCodes.length) {
      throw new Error("Invalid promo code");
    }

    await this.updatePromoCodes({
      selector: { code },
      data: {
        is_used: true,
        used_at: new Date(),
      },
    });
  }

  // Get customer's promo code
  async getCustomerCode(customerId: string) {
    const promoCodes = await this.listPromoCodes({
      customer_id: customerId,
      is_used: false,
    });

    return promoCodes.find((code) => new Date(code.expires_at) > new Date());
  }
}
