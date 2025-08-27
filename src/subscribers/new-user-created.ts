// src/subscribers/new-user-created.ts
import { linkCustomerGroupsToCustomerWorkflow } from "@medusajs/medusa/core-flows";
import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa";
import PromoCodeService from "../modules/promo-code/service";

// Live group ID for "New Buyer" group
const NEW_BUYER_GROUP_ID = "cusgroup_01JWQ5RN74XM9N0KHNPQT5JMRS";

export default async function handleCustomerCreated({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerId = event.data.id;

  // Get customer details
  const query = container.resolve("query");
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["*"],
    filters: { id: customerId },
  });

  if (!customer) {
    console.error("Customer not found:", customerId);
    return;
  }

  try {
    // 1. Add customer to "New Buyer" group
    await linkCustomerGroupsToCustomerWorkflow(container).run({
      input: {
        id: customerId,
        add: [NEW_BUYER_GROUP_ID],
      },
    });

    // 2. Generate unique promo code
    const promoCodeService = container.resolve<PromoCodeService>("promo_code");
    const promoCode = await promoCodeService.generateCodeForCustomer(
      customerId,
      customer.email ?? ""
    );

    // 3. Send welcome email with promo code
    const notificationModuleService = container.resolve(Modules.NOTIFICATION);
    await notificationModuleService.createNotifications({
      to: customer.email || "",
      channel: "email",
      template: "new-user",
      data: {
        user: {
          first_name: customer.first_name,
          email: customer.email,
        },
        promoCodes: [promoCode], // Use the generated unique code
      },
    });

    console.log(
      `✅ Customer ${customerId} processed: added to group, generated promo code ${promoCode}, sent email`
    );
  } catch (error) {
    console.error("Error processing new customer:", error);
    throw error;
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
};
