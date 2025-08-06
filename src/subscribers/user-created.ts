import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa";

export default async function userCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve("query");
  const {
    data: [user],
  } = await query.graph({
    entity: "user",
    fields: ["*"],
    filters: { id: data.id },
  });
  await notificationModuleService.createNotifications({
    to: user.email,
    channel: "email",
    template: "new-user", // Replace with your template ID
  });
}

export const config: SubscriberConfig = {
  event: "user.created",
};
