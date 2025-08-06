import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa";

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve("query");
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["*"],
    filters: { id: data.id },
  });

  if (!customer) {
    // Optionally log an error or handle the missing customer case
    return;
  }

  await notificationModuleService.createNotifications({
    to: customer.email || "",
    channel: "email",
    template: "new-user",
    data: {
      user: {
        first_name: customer.first_name,
        email: customer.email,
      },
    },
  });
}

export const config: SubscriberConfig = {
  event: "customer.created",
};
