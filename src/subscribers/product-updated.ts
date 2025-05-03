import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

export default async function collectionUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  // Send request to your Next.js storefront to revalidate cache
  await fetch(`${process.env.STOREFRONT_URL}/api/revalidate?tags=collections`);
}

export const config: SubscriberConfig = {
  event: "product-collection.updated",
};
