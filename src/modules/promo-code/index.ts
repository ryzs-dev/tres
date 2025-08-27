// src/modules/promo-code/index.ts
import { Module } from "@medusajs/framework/utils";
import PromoCodeService from "./service";

export const PROMO_CODE_MODULE = "promo_code";

export default Module(PROMO_CODE_MODULE, {
  service: PromoCodeService,
});

export * from "./service";
