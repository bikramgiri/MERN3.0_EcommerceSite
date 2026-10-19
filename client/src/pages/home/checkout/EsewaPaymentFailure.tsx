import { useCallback } from "react";
import { syncOrderPayment } from "../../../services/paymentService";
import PaymentStatusView from "./PaymentStatusView";

// eSewa sends cancelled or failed payments here without details, so the server asks
// eSewa about the order saved when the shopper left for payment
export default function EsewaPaymentFailure() {
  const orderId = (() => {
    try {
      return localStorage.getItem("orderId");
    } catch {
      return null;
    }
  })();

  const check = useCallback(() => syncOrderPayment(orderId as string), [orderId]);

  return <PaymentStatusView gateway="eSewa" check={orderId ? check : null} orderId={orderId} />;
}
