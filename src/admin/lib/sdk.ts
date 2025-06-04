import Medusa from "@medusajs/js-sdk";

export const sdk = new Medusa({
  baseUrl: "https://admin.tres.my",
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "session",
  },
});
