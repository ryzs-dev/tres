import { linkCustomerGroupsToCustomerWorkflow } from "@medusajs/medusa/core-flows";

// Replace with your actual group ID from the Admin UI
const NEW_BUYER_GROUP_ID = "cusgroup_01JWQ5RN74XM9N0KHNPQT5JMRS";

export default async function handleCustomerCreated({ event, container }) {
  const customerId = event.data.id;

  // Run the workflow to add the customer to the "New Buyer" group
  await linkCustomerGroupsToCustomerWorkflow(container).run({
    input: {
      id: customerId,
      add: [NEW_BUYER_GROUP_ID],
      // remove: [] // Optional: you can remove from other groups if needed
    },
  });
}

export const config = {
  event: "customer.created",
};
