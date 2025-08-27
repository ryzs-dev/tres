// src/modules/promo-code/models/promo-code.ts
import { model } from "@medusajs/framework/utils";

const PromoCode = model.define("promo_code", {
  id: model.id().primaryKey(),
  code: model.text(),
  customer_id: model.text(),
  customer_email: model.text(),
  discount_type: model.enum(["percentage", "fixed"]).default("percentage"),
  discount_value: model.number(), // e.g., 10 for 10%
  is_used: model.boolean().default(false),
  used_at: model.dateTime().nullable(),
  expires_at: model.dateTime(),
});

export default PromoCode;
