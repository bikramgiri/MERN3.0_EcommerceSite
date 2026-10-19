import { APIAuthenticated } from "../http";
import type { PaymentMethod } from "../types/customer/checkoutTypes";

export type PaymentResult = "paid" | "pending" | "failed";

export interface PaymentCheckResponse {
  message: string;
  paymentStatus: PaymentResult;
  data: { id: string; totalAmount: number; orderStatus: string; paymentMethod: PaymentMethod };
}

/** Server response that starts an online payment (new order or "pay again") */
export interface PaymentStartResponse {
  data?: { id?: string };
  pidx?: string;
  paymentUrl?: string;
  esewaPaymentUrl?: string;
  esewaPaymentData?: Record<string, unknown>;
}

/** eSewa expects a normal form POST, not an API call */
const submitEsewaForm = (url: string, fields: Record<string, unknown>) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
};

/**
 * Sends the shopper to Khalti or eSewa if the response asks for it.
 * Returns the gateway name, or null when there's nothing to redirect to (cash on delivery).
 */
export const redirectToGateway = (response: PaymentStartResponse | undefined): "Khalti" | "eSewa" | null => {
  if (!response) return null;
  const orderId = response.data?.id;
  try {
    if (orderId) localStorage.setItem("orderId", orderId);
    if (response.pidx) localStorage.setItem("khaltiPidx", response.pidx);
  } catch {
    // The return pages can still find the order from the gateway's own parameters
  }
  if (response.paymentUrl) {
    window.location.href = response.paymentUrl;
    return "Khalti";
  }
  if (response.esewaPaymentUrl && response.esewaPaymentData) {
    submitEsewaForm(response.esewaPaymentUrl, response.esewaPaymentData);
    return "eSewa";
  }
  return null;
};

/** Pay again for an unpaid order, or switch it to cash on delivery */
export const retryOrderPayment = async (orderId: string, paymentMethod: PaymentMethod) =>
  (await APIAuthenticated.post(`/customer/order/${orderId}/pay`, { paymentMethod })).data as PaymentStartResponse &
    Partial<PaymentCheckResponse>;

/** Ask the server to re-check an online payment with the gateway */
export const syncOrderPayment = async (orderId: string) =>
  (await APIAuthenticated.post(`/customer/order/${orderId}/sync-payment`)).data as PaymentCheckResponse;
