import axios from "axios";
import { envConfig } from "../config/config";
import { generateHmacSha256Hash } from "./helper";
import Order from "../database/models/orderModel";
import Payment from "../database/models/paymentModel";
import { KhaltiResponse, PaymentMethod, PaymentStatus } from "../types";

export type GatewayResult = "paid" | "pending" | "failed";

/** How long a shopper has to finish an online payment before the order is cancelled */
export const UNPAID_ORDER_HOURS = Math.max(1, Number(process.env.UNPAID_ORDER_HOURS) || 24);

/** When an unpaid online order will be cancelled (null if it isn't waiting for payment) */
export const paymentDueAt = (order: { orderStatus: string; Payment?: { paymentMethod: string; paymentStatus: string; updatedAt?: Date | string } | null }) => {
  const payment = order.Payment;
  if (order.orderStatus !== "Pending" || !payment || payment.paymentMethod === PaymentMethod.COD) return null;
  if (payment.paymentStatus === PaymentStatus.Paid || !payment.updatedAt) return null;
  return new Date(new Date(payment.updatedAt).getTime() + UNPAID_ORDER_HOURS * 60 * 60 * 1000).toISOString();
};

// eSewa wants amounts like "520" or "495.5", exactly as they were signed
const esewaAmount = (order: Order) => Number(order.totalAmount).toString();

/** Starts a Khalti session for an order and saves its pidx on the payment */
export const startKhaltiPayment = async (order: Order, payment: Payment) => {
  const response = await axios.post(
    envConfig.khaltiPaymentUrl as string,
    {
      return_url: envConfig.clientUrl + "/payment/khalti-callback",
      website_url: envConfig.clientUrl,
      amount: Math.round(Number(order.totalAmount) * 100), // paisa
      purchase_order_id: order.id,
      purchase_order_name: "orderName_" + order.id,
    },
    { headers: { Authorization: `Key ${envConfig.khaltiSecretKey}` } },
  );
  const khalti: KhaltiResponse = response.data;
  payment.pidx = khalti.pidx;
  await payment.save();
  return { pidx: khalti.pidx, paymentUrl: khalti.payment_url };
};

/**
 * Signed eSewa form fields for an order. Each attempt gets its own transaction id
 * (eSewa rejects a reused one), saved on the payment so the result can be matched.
 */
export const buildEsewaPayment = async (order: Order, payment: Payment) => {
  const transactionUuid = `${order.id}-${Date.now().toString(36)}`;
  const totalAmount = esewaAmount(order);
  const productCode = envConfig.esewaMerchantId as string;
  const signature = generateHmacSha256Hash(
    `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`,
    envConfig.esewaSecret as string,
  );
  payment.pidx = transactionUuid;
  await payment.save();
  return {
    esewaPaymentUrl: envConfig.esewaPaymentUrl,
    esewaPaymentData: {
      amount: totalAmount,
      tax_amount: "0",
      product_service_charge: "0",
      product_delivery_charge: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      success_url: envConfig.clientUrl + "/payment/esewa-callback",
      failure_url: envConfig.clientUrl + "/payment/esewa-failure",
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    },
  };
};

/**
 * Asks the gateway what really happened to an online payment. The amount and
 * merchant code always come from our own records, never from the browser.
 */
export const checkGatewayStatus = async (order: Order, payment: Payment): Promise<GatewayResult> => {
  if (payment.paymentStatus === PaymentStatus.Paid) return "paid";
  if (!payment.pidx) return "failed";

  if (payment.paymentMethod === PaymentMethod.Khalti) {
    const response = await axios.post(
      envConfig.khaltiVerificationUrl as string,
      { pidx: payment.pidx },
      { headers: { Authorization: `Key ${envConfig.khaltiSecretKey}` } },
      // Khalti answers 400 for expired/cancelled sessions; the body still has the status
    ).catch((error) => {
      if (axios.isAxiosError(error) && error.response?.data?.status) return error.response;
      throw error;
    });
    const status = String(response?.data?.status || "");
    const paidAmount = Number(response?.data?.total_amount);
    if (status === "Completed") {
      return paidAmount === Math.round(Number(order.totalAmount) * 100) ? "paid" : "failed";
    }
    if (status === "Pending" || status === "Initiated") return "pending";
    return "failed"; // Expired, User canceled, Refunded, ...
  }

  if (payment.paymentMethod === PaymentMethod.Esewa) {
    const params = new URLSearchParams({
      product_code: String(envConfig.esewaMerchantId),
      total_amount: esewaAmount(order),
      transaction_uuid: payment.pidx,
    });
    const response = await axios.get(`${envConfig.esewaVerificationUrl}?${params.toString()}`);
    const status = String(response.data?.status || "");
    if (status === "COMPLETE") return "paid";
    if (status === "PENDING" || status === "AMBIGUOUS") return "pending";
    return "failed"; // NOT_FOUND, CANCELED, refunds
  }

  return "failed";
};
