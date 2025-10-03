import {
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";

type WorkflowInput = {
  id: string;
};

export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    // @ts-ignore
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "*",
        "id",
        "email",
        "currency_code",
        "total",
        "items.*",
        "shipping_methods.*",
        "billing_address.*",
        "shipping_address.*",
      ],
      filters: {
        id,
      },
    });

    const notification = sendNotificationStep([
      {
        to: orders[0].email ?? "",
        channel: "email",
        template: "order-placed", // Your existing confirmation email
        data: {
          order: orders[0],
        },
      },
      {
        to: orders[0].email ?? "",
        channel: "email",
        template: "thank-you", // Your new thank you email
        data: {
          order: orders[0],
        },
      },
    ]);

    return new WorkflowResponse(notification);
  }
);
