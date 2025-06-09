import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import BundleModule from "../modules/bundle";

export default defineLink(
  BundleModule.linkable.bundle,
  ProductModule.linkable.product
);
