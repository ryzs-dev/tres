import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import crypto from "crypto";
import RazorpayProviderService from "../../../../modules/razorpay-payment/service";
import { Modules } from "@medusajs/framework/utils";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    payment_collection_id,
    payment_collection_payment_session_id,
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
  } = req.body as {
    payment_collection_id?: string;
    payment_collection_payment_session_id?: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!payment_collection_id) {
    return res.status(400).json({ message: "Missing payment_collection_id" });
  }

  if (!payment_collection_payment_session_id) {
    return res
      .status(400)
      .json({ message: "Missing payment_collection_payment_session_id" });
  }

  const paymentCollectionService = req.scope.resolve(Modules.PAYMENT);

  const data = await paymentCollectionService.updatePaymentCollections(
    payment_collection_id,
    {
      metadata: {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      },
    }
  );

  console.log(
    "Payment collection updated with Razorpay payment details:",
    data
  );

  await paymentCollectionService.authorizePaymentSession(
    payment_collection_payment_session_id,
    {
      id: razorpay_payment_id,
      order_id: razorpay_order_id,
      signature: razorpay_signature,
    }
  );

  return res
    .status(200)
    .json({ message: "Payment verified and collection updated successfully" });
}
