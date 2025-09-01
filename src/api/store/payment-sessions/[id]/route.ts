// src/api/store/payment-sessions/[id]/route.ts (in your Medusa backend)
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/utils";
import { Modules } from "@medusajs/framework/utils";
import { IPaymentModuleService } from "@medusajs/framework/types";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-publishable-api-key, Authorization"
  );

  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payment session ID is required"
      );
    }

    if (!data) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payment session data is required"
      );
    }

    console.log("📝 Updating payment session:", {
      id,
      data_keys: Object.keys(data),
      has_payment_id: !!data.payment_id,
      has_signature: !!data.signature,
    });

    const paymentModuleService: IPaymentModuleService = req.scope.resolve(
      Modules.PAYMENT
    );

    // Retrieve the current payment session
    const currentSession =
      await paymentModuleService.retrievePaymentSession(id);

    if (!currentSession) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Payment session not found"
      );
    }

    console.log("📋 Current payment session found");

    // Try updating with the correct method signature
    try {
      const updatedSession = await paymentModuleService.updatePaymentSession(
        id,
        {
          data: {
            ...currentSession.data,
            ...data,
          },
        }
      );

      console.log("✅ Payment session updated successfully");

      return res.json({
        payment_session: updatedSession,
      });
    } catch (updateError: any) {
      console.error(
        "Update method failed, trying alternative approach:",
        updateError
      );

      // Alternative: Try updating using a different approach
      const updatedSession = await paymentModuleService.updatePaymentSession({
        id: id,
        data: {
          ...currentSession.data,
          ...data,
        },
        currency_code: currentSession.currency_code,
        amount: currentSession.amount,
      });

      console.log(
        "✅ Payment session updated successfully (alternative method)"
      );

      return res.json({
        payment_session: updatedSession[0],
      });
    }
  } catch (err: any) {
    console.error("❌ Payment session update failed:", err);

    req.scope
      .resolve("logger")
      .error(`Payment session update failed: ${err.message}`);

    return res.status(400).json({
      error: err.message,
    });
  }
};

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-publishable-api-key, Authorization"
  );
  res.status(200).end();
};
