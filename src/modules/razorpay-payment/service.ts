// src/modules/razorpay/service.ts
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
  InitiatePaymentOutput,
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
import Razorpay from "razorpay";
import crypto from "crypto";
import {
  validatePaymentVerification,
  validateWebhookSignature,
} from "razorpay/dist/utils/razorpay-utils";

type Options = {
  apiKey: string; // key_id in Razorpay/Curlec
  apiSecret: string; // key_secret in Razorpay/Curlec
  webhookSecret?: string;
  // Curlec specific options
  baseUrl?: string; // For future use if different from default
};

type InjectedDependencies = {
  logger: Logger;
};

interface RazorpayOrderData {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  payment_capture?: number;
}

interface RazorpayPaymentData {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  captured: boolean;
  created_at: number;
}

class RazorpayProviderService extends AbstractPaymentProvider<Options> {
  static resolutionKey = "razorpayProviderService";

  protected logger_: Logger;
  protected options_: Options;
  protected client: Razorpay;

  static identifier = "razorpay";

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options);

    this.logger_ = container.logger;
    this.options_ = options;

    // Initialize Razorpay client with latest SDK v2.9.6
    // Uses https://api.razorpay.com/v1/ as base URL by default
    this.client = new Razorpay({
      key_id: options.apiKey,
      key_secret: options.apiSecret,
    });

    this.logger_.info(
      `Razorpay Curlec payment provider initialized with key_id: ${options.apiKey?.slice(0, 12) + "..."}`
    );
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "API key (key_id) is required in the provider's options."
      );
    }
    if (!options.apiSecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "API secret (key_secret) is required in the provider's options."
      );
    }
  }

  // Initiate Payment - Create Razorpay Order
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    try {
      const { amount, currency, metadata } = input.data as {
        amount: number;
        currency: string;
        metadata?: Record<string, string>;
      };

      console.log("Input", input.data);

      // Convert amount to smallest currency unit (cents for MYR)
      const amountInSmallestUnit = Math.round(amount) * 100;
      const receiptId = metadata?.cart_id || `tres_receipt_${Date.now()}`;
      const currencyCode = currency.toUpperCase();

      const orderData: RazorpayOrderData = {
        amount: amountInSmallestUnit,
        currency: currencyCode,
        receipt: receiptId,
        payment_capture: 1,
      };

      console.log("Creating Razorpay order:", orderData);

      this.logger_.info(
        `Creating Razorpay order: ${JSON.stringify({
          amount: orderData.amount,
          currency: orderData.currency,
          receipt: orderData.receipt,
        })}`
      );

      // Create order using the latest SDK
      const order = await this.client.orders.create(orderData);

      this.logger_.info(
        `Razorpay order created successfully: ${JSON.stringify({
          order_id: order.id,
          amount: order.amount,
          status: order.status,
        })}`
      );
      console.log("Razorpay order created:", order);
      console.log("Razorpay order amount:", Number(order.amount) / 100);

      return {
        id: order.id,
        data: {
          id: order.id,
          order_id: order.id,
          amount: Number(order.amount),
          currency: order.currency,
          status: order.status,
          receipt: order.receipt,
          key_id: this.options_.apiKey,
          created_at: order.created_at,
          notes: order.notes,
        },
      };
    } catch (error: any) {
      this.logger_.error(
        `Error initiating Razorpay payment: ${error.error.reason}`
      );
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to initiate payment: ${error.error.reason}`
      );
    }
  }

  // Authorize Payment
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      console.log(
        "🔍 Authorize payment input:",
        JSON.stringify(input, null, 2)
      );

      const sessionData = input.data as any; // Adjusted to use the correct property from AuthorizePaymentInput

      const sessionContext = input.context as any;

      console.log("📦 Session data:", sessionData);
      console.log("📋 Session context:", sessionContext);

      // Try to get verification data from the session data (if it was updated)
      let payment_id = sessionContext?.id;
      let order_id = sessionContext?.order_id;
      let signature = sessionContext?.signature;

      console.log("📋 Extracted verification data:", {
        payment_id,
        order_id,
        signature: signature ? "present" : "missing",
      });

      if (!payment_id) {
        console.log(
          "⚠️ No payment_id found, checking original order for payments..."
        );

        // Fall back to checking the original order_id from session data
        const originalOrderId =
          sessionData?.order_id || sessionData?.data?.order_id;

        if (originalOrderId) {
          try {
            const orderPayments =
              await this.client.orders.fetchPayments(originalOrderId);

            console.log(orderPayments);
            const successfulPayment = orderPayments.items?.find(
              (payment: any) =>
                payment.status === "captured" || payment.status === "authorized"
            );

            if (successfulPayment) {
              console.log(
                "✅ Found successful payment via order lookup:",
                successfulPayment.id
              );
              return {
                status: successfulPayment.captured ? "captured" : "authorized",
                data: {
                  id: successfulPayment.id,
                  payment_id: successfulPayment.id,
                  order_id: successfulPayment.order_id,
                  amount: successfulPayment.amount,
                  currency: successfulPayment.currency,
                  status: successfulPayment.status,
                  captured: successfulPayment.captured,
                },
              };
            }
          } catch (orderError: any) {
            console.error("Error checking order payments:", orderError);
          }
        }

        return {
          status: "requires_more",
          data: {
            error: "Payment verification data not found",
            session_data_keys: Object.keys(sessionData || {}),
          },
        };
      }

      // Fetch payment details from Razorpay
      const payment = (await this.client.payments.fetch(
        payment_id
      )) as RazorpayPaymentData;

      console.log("📊 Payment details:", {
        payment_id: payment.id,
        status: payment.status,
        captured: payment.captured,
        amount: payment.amount,
      });

      const isAuthorized =
        payment.status === "captured" || payment.status === "authorized";

      if (isAuthorized) {
        const status = payment.captured ? "captured" : "authorized";
        console.log(`✅ Payment ${status}: ${payment_id}`);

        return {
          status,
          data: {
            id: payment.id,
            payment_id: payment.id,
            order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            captured: payment.captured,
          },
        };
      }

      if (payment.status === "failed") {
        console.error(`❌ Payment failed: ${payment_id}`);
        return {
          status: "error",
          data: {
            id: payment.id,
            status: payment.status,
            error: "Payment failed",
          },
        };
      }

      console.log(
        `⏳ Payment requires more: ${payment_id}, status: ${payment.status}`
      );
      return {
        status: "requires_more",
        data: {
          id: payment.id,
          status: payment.status,
        },
      };
    } catch (error: any) {
      console.error("💥 Error authorizing payment:", error);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to authorize payment: ${error.message}`
      );
    }
  }

  // Capture Payment
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      const { payment_id, amount } = input.data as {
        payment_id?: string;
        amount?: number;
      };

      console.log("Capture Payment Step Input:", input.data);

      if (!payment_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Payment ID is required for capture"
        );
      }

      // Check if payment is already captured
      const payment = (await this.client.payments.fetch(
        payment_id
      )) as RazorpayPaymentData;

      if (payment.captured) {
        this.logger_.info(
          `Payment already captured: ${JSON.stringify({ payment_id })}`
        );
        return { data: JSON.parse(JSON.stringify(payment)) };
      }

      if (payment.status === "authorized") {
        // Capture the payment with specified amount or full amount
        const captureAmount = amount ? Math.round(amount) : payment.amount;

        const capturedPayment = (await this.client.payments.capture(
          payment_id,
          captureAmount,
          payment.currency
        )) as unknown as RazorpayPaymentData;

        this.logger_.info(
          `Payment captured successfully: ${JSON.stringify({
            payment_id: capturedPayment.id,
            amount: capturedPayment.amount,
          })}`
        );

        return { data: capturedPayment as unknown as Record<string, unknown> };
      } else {
        this.logger_.info(
          `Payment not eligible for capture: payment_id=${payment_id}, status=${payment.status}`
        );
        return { data: payment as unknown as Record<string, unknown> };
      }
    } catch (error: any) {
      this.logger_.error(`Error capturing payment: ${error.message}`);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to capture payment: ${error.message}`
      );
    }
  }

  // Cancel Payment
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      const { payment_id, order_id } = input.data as {
        payment_id?: string;
        order_id?: string;
      };

      if (payment_id) {
        // Check payment status
        const payment = (await this.client.payments.fetch(
          payment_id
        )) as RazorpayPaymentData;

        if (payment.status === "captured") {
          // Cannot cancel captured payment, would need refund
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Cannot cancel captured payment. Use refund instead."
          );
        }

        this.logger_.info(`Payment cancelled ${payment_id}`);

        return {
          data: {
            id: payment.id,
            payment_id: payment.id,
            status: "cancelled",
            canceled: true,
          },
        };
      }

      // For orders without payment, just mark as cancelled
      return {
        data: {
          id: order_id,
          order_id,
          status: "cancelled",
          canceled: true,
        },
      };
    } catch (error: any) {
      this.logger_.error(`Error canceling payment: ${error.message}`);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to cancel payment: ${error.message}`
      );
    }
  }

  // Delete Payment
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    try {
      const { payment_id, order_id } = input.data as {
        payment_id?: string;
        order_id?: string;
      };

      if (!payment_id && !order_id) {
        return {};
      }

      if (payment_id) {
        try {
          const payment = (await this.client.payments.fetch(
            payment_id
          )) as RazorpayPaymentData;
          if (payment.status === "created" || payment.status === "failed") {
            this.logger_.info(`Payment ${payment_id} marked as deleted`);
          }
        } catch (error: any) {
          if (error.error?.code === "BAD_REQUEST_ERROR") {
            this.logger_.warn(`Payment ${payment_id} does not exist`);
          } else {
            throw error;
          }
        }
      }

      return {};
    } catch (error: any) {
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
    try {
      const { payment_id, order_id } = input.data as {
        payment_id?: string;
        order_id?: string;
      };

      let status: PaymentSessionStatus;
      let paymentData: any;

      if (payment_id) {
        const payment = (await this.client.payments.fetch(
          payment_id
        )) as RazorpayPaymentData;
        paymentData = payment;

        switch (payment.status) {
          case "created":
            status = PaymentSessionStatus.PENDING;
            break;
          case "authorized":
            status = PaymentSessionStatus.AUTHORIZED;
            break;
          case "captured":
            status = PaymentSessionStatus.CAPTURED;
            break;
          case "refunded":
            status = PaymentSessionStatus.CANCELED;
            break;
          case "failed":
            status = PaymentSessionStatus.ERROR;
            break;
          default:
            status = PaymentSessionStatus.PENDING;
        }
      } else if (order_id) {
        const order = await this.client.orders.fetch(order_id);
        paymentData = order;

        switch (order.status) {
          case "created":
            status = PaymentSessionStatus.PENDING;
            break;
          case "attempted":
            status = PaymentSessionStatus.REQUIRES_MORE;
            break;
          case "paid":
            status = PaymentSessionStatus.CAPTURED;
            break;
          default:
            status = PaymentSessionStatus.PENDING;
        }
      } else {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Either payment_id or order_id is required"
        );
      }

      return {
        status,
        data: paymentData,
      };
    } catch (error: any) {
      this.logger_.error(`Error getting payment status: ${error.message}`);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to get payment status: ${error.message}`
      );
    }
  }

  // Refund Payment
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    try {
      const { payment_id, amount } = input.data as {
        payment_id?: string;
        amount: number;
      };

      if (!payment_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Payment ID is required for refund"
        );
      }

      const refundData = {
        amount: Math.round(amount), // Convert to smallest unit
        speed: "normal" as const,
        notes: {
          refund_reason: "Customer requested refund",
          processed_by: "medusa",
          refund_timestamp: new Date().toISOString(),
        },
        receipt: `refund_${Date.now()}`,
      };

      const refund = await this.client.payments.refund(payment_id, refundData);

      this.logger_.info(
        `Refund processed successfully: ${JSON.stringify({
          refund_id: refund.id,
          payment_id: refund.payment_id,
          amount: refund.amount,
        })}`
      );

      return {
        data: refund as unknown as Record<string, unknown>,
      };
    } catch (error: any) {
      this.logger_.error(`Error refunding payment: ${error.message}`);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to refund payment: ${error.message}`
      );
    }
  }

  // Update Payment
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    try {
      const { context, amount, currency } = input.data as {
        context?: any;
        amount?: number;
        currency?: string;
      };

      const order_id = input.data?.order_id as string;

      if (amount && currency) {
        // Create new order with updated amount
        const amountInSmallestUnit = Math.round(amount);

        const orderData: RazorpayOrderData = {
          amount: amountInSmallestUnit,
          currency: currency.toUpperCase(),
          receipt: `updated_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          payment_capture: 1,
          notes: {
            updated_from_order: order_id,
            update_timestamp: new Date().toISOString(),
            session_id: context?.session_id || "",
            ...(context?.customer && {
              customer_data: JSON.stringify(context.customer),
            }),
          },
        };

        const order = await this.client.orders.create(orderData);

        this.logger_.info(
          `Payment updated with new order: ${JSON.stringify({
            new_order_id: order.id,
            old_order_id: order_id,
            amount: order.amount,
          })}`
        );

        return {
          data: order as unknown as Record<string, unknown>,
        };
      }

      // If no amount/currency update, just return existing data
      if (order_id) {
        const order = await this.client.orders.fetch(order_id);
        return {
          data: order as unknown as Record<string, unknown>,
        };
      }

      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No update data provided"
      );
    } catch (error: any) {
      this.logger_.error(`Error updating payment: ${error.message}`);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to update payment: ${error.message}`
      );
    }
  }

  // Retrieve Payment
  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      const { payment_id, order_id } = input.data as {
        payment_id?: string;
        order_id?: string;
      };

      if (payment_id) {
        const payment = await this.client.payments.fetch(payment_id);
        return {
          data: payment as unknown as Record<string, unknown>,
        };
      }

      if (order_id) {
        const order = await this.client.orders.fetch(order_id);
        return {
          data: order as unknown as Record<string, unknown>,
        };
      }

      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Either payment_id or order_id is required"
      );
    } catch (error: any) {
      this.logger_.error(`Error retrieving payment: ${error.message}`);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to retrieve payment: ${error.message}`
      );
    }
  }

  // Get Webhook Actions - Enhanced for Curlec
  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const { data, rawData, headers } = payload;

    // Verify Razorpay webhook signature using the utility function
    if (this.options_.webhookSecret) {
      try {
        const signature = headers["x-razorpay-signature"] as string;
        const isValidSignature = validateWebhookSignature(
          rawData.toString(),
          signature,
          this.options_.webhookSecret
        );

        if (!isValidSignature) {
          this.logger_.error("Invalid Razorpay webhook signature");
          return { action: "failed" };
        }
      } catch (error: any) {
        this.logger_.error("Error verifying webhook signature:", error);
        return { action: "failed" };
      }
    }

    // Process different Razorpay event types
    try {
      const event = data;
      const eventType = event.event;
      const paymentEntity =
        (
          event.payload as {
            payment?: { entity: any };
            order?: { entity: any };
          }
        )?.payment?.entity ||
        (
          event.payload as {
            payment?: { entity: any };
            order?: { entity: any };
          }
        )?.order?.entity;

      if (!paymentEntity) {
        this.logger_.info(`No payment entity in webhook ${eventType}`);
        return { action: "not_supported" };
      }

      // Extract session_id from notes
      const sessionId = paymentEntity.notes?.session_id;
      if (!sessionId) {
        this.logger_.info(`No session_id in webhook notes${eventType}`);
        return { action: "not_supported" };
      }

      this.logger_.info(
        `Processing webhook event: event=${eventType}, session_id=${sessionId}, amount=${paymentEntity.amount}`
      );

      switch (eventType) {
        case "payment.captured":
          return {
            action: "captured",
            data: {
              session_id: sessionId,
              amount: new BigNumber(paymentEntity.amount),
            },
          };

        case "payment.failed":
          return {
            action: "failed",
            data: {
              session_id: sessionId,
              amount: new BigNumber(paymentEntity.amount),
            },
          };

        case "payment.authorized":
          return {
            action: "authorized",
            data: {
              session_id: sessionId,
              amount: new BigNumber(paymentEntity.amount),
            },
          };

        case "order.paid":
          return {
            action: "captured",
            data: {
              session_id: sessionId,
              amount: new BigNumber(paymentEntity.amount),
            },
          };

        default:
          this.logger_.info(`Unhandled Razorpay webhook event: ${eventType}`);
          return { action: "not_supported" };
      }
    } catch (error: any) {
      this.logger_.error("Error processing Razorpay webhook:", error);
      return { action: "failed" };
    }
  }
}

export default RazorpayProviderService;
