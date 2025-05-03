import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput, // Ensure this type includes client_secret
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import { Logger } from "@medusajs/medusa";
import Stripe from "stripe";

type Options = {
  apiKey: string;
  webhookSecret?: string;
};

type InjectedDependencies = {
  logger: Logger;
};

class StripePaymentProviderService extends AbstractPaymentProvider<Options> {
  protected logger_: Logger;
  protected options_: Options;

  protected client: Stripe;

  static identifier = "stripe-payment";

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options);

    this.logger_ = container.logger;
    this.options_ = options;

    // TODO initialize your client
    this.client = new Stripe(options.apiKey, {
      apiVersion: "2025-02-24.acacia",
    });
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "API key is required in the provider's options."
      );
    }
  }

  //   Capture Payment
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const externalId = input.data?.id as string;

    const paymentIntent = await this.client.paymentIntents.retrieve(externalId);

    if (
      paymentIntent.status === "requires_capture" &&
      paymentIntent.amount_capturable > 0
    ) {
      const capturedPaymentIntent =
        await this.client.paymentIntents.capture(externalId);
      console.log("Payment captured:", capturedPaymentIntent);
      return { data: JSON.parse(JSON.stringify(capturedPaymentIntent)) };
    } else {
      console.log("Payment already captured or not eligible for capture.");
      return { data: JSON.parse(JSON.stringify(paymentIntent)) };
    }
  }

  //   Authorize Payment
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const externalId = input.data?.id as string;

      if (externalId) {
        // If we already have a payment intent, retrieve it
        const paymentIntent =
          await this.client.paymentIntents.retrieve(externalId);

        // Check the status of the payment intent
        if (
          paymentIntent.status === "requires_action" ||
          paymentIntent.status === "requires_confirmation"
        ) {
          // Payment requires additional action from the customer
          return {
            status: "requires_more",
            data: {
              id: paymentIntent.id,
              client_secret: paymentIntent.client_secret ?? undefined,
              status: paymentIntent.status,
              amount: paymentIntent.amount,
              // Include any other relevant data
            },
          };
        }

        const isAuthorized =
          paymentIntent.status === "succeeded" ||
          paymentIntent.status === "requires_capture";

        if (isAuthorized) {
          // Ensure `capture` is a boolean or default to false
          const capture =
            (this.options_ as { capture?: boolean })?.capture ?? false;
          const status = capture ? "captured" : "authorized";

          return {
            status,
            data: {
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount: paymentIntent.amount,
              client_secret: paymentIntent.client_secret ?? undefined,
              // Include any other relevant data
            },
          };
        }

        return {
          status: "error",
          data: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            error: "Unexpected payment intent status",
          },
        };
      }

      // Handle other statuses
      // Handle other statuses
      return {
        status: "error",
        data: {
          id: null,
          status: "unknown",
          error: "Payment intent ID is missing",
        },
      };
    } catch (error) {
      this.logger_.error(`Error authorizing payment: ${error.message}`);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to authorize payment: ${error.message}`
      );
    }
  }

  //   Initatiate / Create Payment
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput & { client_secret?: string }> {
    const { amount, currency } = input.data as {
      amount: number;
      currency: string;
    };

    const paymentIntent = await this.client.paymentIntents.create({
      amount: amount,
      currency: currency,
      confirm: false,
    });

    return {
      id: paymentIntent.id,
      data: { ...paymentIntent },
    };
  }

  //   Cancel Payment
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // Extract the payment intent ID from the payment data
    const externalId = input.data?.id as string;
    try {
      if (!externalId) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Payment intent ID is required to cancel payment"
        );
      }

      // Cancel the payment intent using Stripe's API
      const intent = await this.client.paymentIntents.cancel(externalId);

      // Return the updated payment data
      return {
        data: {
          id: intent.id,
          status: intent.status,
          amount: intent.amount,
          canceled: true,
          // Include any other relevant data from the Stripe response
        },
      };
    } catch (error) {
      this.logger_.error(`Error canceling payment: ${error.message}`);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to cancel payment: ${error.message}`
      );
    }
  }

  //   Delete Payment
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    // Extract the payment intent ID from the payment data
    const externalId = input.data?.id as string;
    try {
      if (!externalId) {
        // If there's no payment intent ID, there's nothing to delete
        return {};
      }

      // Cancel the payment intent in Stripe
      // Note: In Stripe, you can't actually delete a payment intent, but you can cancel it
      await this.client.paymentIntents.cancel(externalId);

      // Return an empty object as required by the DeletePaymentOutput type
      return {};
    } catch (error) {
      // Log the error but don't throw if it's because the payment intent was already canceled
      if (error.code === "payment_intent_canceled") {
        this.logger_.warn(`Payment intent ${externalId} was already canceled`);
        return {};
      }

      this.logger_.error(`Error deleting payment: ${error.message}`);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to delete payment: ${error.message}`
      );
    }
  }

  // Get Payment Status
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const externalId = input.data?.id as string;

    // Retrieve payment intent status from Stripe
    const paymentIntent = await this.client.paymentIntents.retrieve(externalId);

    let status: PaymentSessionStatus;

    switch (paymentIntent.status) {
      case "requires_payment_method":
      case "requires_confirmation":
      case "processing":
        status = PaymentSessionStatus.PENDING;
        break;
      case "requires_action":
        status = PaymentSessionStatus.REQUIRES_MORE;
        break;
      case "requires_capture":
        status = PaymentSessionStatus.AUTHORIZED;
        break;
      case "canceled":
        status = PaymentSessionStatus.CANCELED;
        break;
      case "succeeded":
        status = PaymentSessionStatus.CAPTURED;
        break;
      default:
        status = PaymentSessionStatus.PENDING;
    }

    return {
      status,
      data: { ...paymentIntent },
    };
  }

  // Refund Payment
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const { amount } = input.data as { amount: number };
    const externalId = input.data?.id as string;

    try {
      // Call Stripe API to create a refund
      const refund = await this.client.refunds.create({
        payment_intent: externalId,
        amount: Math.round(amount),
      });

      return {
        data: { ...refund },
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to refund payment: ${error.message}`
      );
    }
  }

  //   Update Payment
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const { context } = input.data as {
      context: any;
    };
    const externalId = input.data?.id as string;

    try {
      // Call Stripe API to update the payment intent
      const paymentIntent = await this.client.paymentIntents.update(
        externalId,
        {
          // You can update other fields as needed
          metadata: {
            ...(context?.customer && {
              customer: JSON.stringify(context.customer),
            }),
          },
        }
      );

      return {
        data: { ...paymentIntent },
      };
    } catch (error) {
      throw new Error(`Failed to update payment: ${error.message}`);
    }
  }

  //   Retreive Payment
  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const externalId = input.data?.id as string;

    try {
      // Call Stripe API to retrieve the payment intent
      const paymentIntent =
        await this.client.paymentIntents.retrieve(externalId);

      return {
        data: { ...paymentIntent },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve payment: ${error.message}`);
    }
  }

  //   Get Webhook Actions
  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { data, rawData, headers } = payload;

    // Verify Stripe webhook signature if you have a webhook secret
    if (this.options_.webhookSecret) {
      try {
        const signature = headers["stripe-signature"];
        this.client.webhooks.constructEvent(
          rawData,
          signature as string,
          this.options_.webhookSecret
        );
      } catch (error) {
        return {
          action: "failed",
        };
      }
    }

    // Process different Stripe event types
    try {
      const event = data;
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = (event.data as Stripe.Event.Data)
            .object as Stripe.PaymentIntent;
          // Extract session_id from metadata
          const sessionId = paymentIntent.metadata?.session_id;

          if (!sessionId) {
            return { action: "not_supported" };
          }

          return {
            action: "captured",
            data: {
              session_id: sessionId,
              amount: new BigNumber(paymentIntent.amount),
            },
          };

        case "payment_intent.payment_failed":
          const failedIntent = (event.data as Stripe.Event.Data)
            .object as Stripe.PaymentIntent;
          const failedSessionId = failedIntent.metadata?.session_id;

          if (!failedSessionId) {
            return { action: "not_supported" };
          }

          return {
            action: "failed",
            data: {
              session_id: failedSessionId,
              amount: new BigNumber(failedIntent.amount),
            },
          };

        case "payment_intent.requires_action":
          const actionIntent = (event.data as Stripe.Event.Data)
            .object as Stripe.PaymentIntent;
          const actionSessionId = actionIntent.metadata?.session_id;

          if (!actionSessionId) {
            return { action: "not_supported" };
          }

          return {
            action: "requires_more",
            data: {
              session_id: actionSessionId,
              amount: new BigNumber(actionIntent.amount),
            },
          };

        case "payment_intent.amount_capturable_updated":
          const authorizedIntent = (event.data as Stripe.Event.Data)
            .object as Stripe.PaymentIntent;
          const authorizedSessionId = authorizedIntent.metadata?.session_id;

          if (
            !authorizedSessionId ||
            authorizedIntent.status !== "requires_capture"
          ) {
            return { action: "not_supported" };
          }

          return {
            action: "authorized",
            data: {
              session_id: authorizedSessionId,
              amount: new BigNumber(authorizedIntent.amount),
            },
          };

        default:
          return { action: "not_supported" };
      }
    } catch (error) {
      return { action: "failed" };
    }
  }
}

export default StripePaymentProviderService;
