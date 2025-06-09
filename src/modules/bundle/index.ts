import { Module } from "@medusajs/framework/utils";
import BundleModuleService from "./service";

export const BUNDLE_MODULE = "bundleModule";

export default Module(BUNDLE_MODULE, {
  service: BundleModuleService,
});
