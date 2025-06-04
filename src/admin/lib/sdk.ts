import Medusa from "@medusajs/js-sdk";

export const sdk = new Medusa({
  baseUrl: process.env.ADMIN_CORS || "https://admin.tres.my",
  debug: process.env.NODE_ENV === "development",
  auth: {
    type: "session",
  },
});
