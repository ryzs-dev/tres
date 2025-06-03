import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: promotions } = await query.graph({
    entity: "promotion",
    fields: ["*", "campaign.name"], // Retrieve all default fields; adjust as needed
  });
  res.json({ promotions });
};
