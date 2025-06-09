import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import BundleModule from "../modules/bundle";

export default defineLink(
  {
    linkable: BundleModule.linkable.bundleItem,
    isList: true,
  },
  ProductModule.linkable.product
);
