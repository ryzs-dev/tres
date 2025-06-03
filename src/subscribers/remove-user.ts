import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { linkCustomerGroupsToCustomerWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

const NEW_BUYER_GROUP_ID = "cusgroup_01JWSYP8ZXDGW38JW2NSJE4JS8";

export default async function handleOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  // Resolve the query resource from the container
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  // Fetch the order with its customer_id
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["customer_id"],
    filters: { id: data.id },
  });
  const customerId = orders[0]?.customer_id;

  if (customerId) {
    const custResult = await linkCustomerGroupsToCustomerWorkflow(
      container
    ).run({
      input: {
        id: customerId,
        remove: [NEW_BUYER_GROUP_ID],
      },
    });
  } else {
    console.log("No customer_id found for order:", data.id);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
