import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../../hooks/hooks";
import { verifyKhaltiPayment } from "../../../store/customer/checkoutSlice";
import PaymentStatusView from "./PaymentStatusView";

// Khalti sends the shopper back here with ?pidx=...&purchase_order_id=...&status=...
export default function KhaltiPaymentCallback() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const storedPidx = (() => {
    try {
      return localStorage.getItem("khaltiPidx");
    } catch {
      return null;
    }
  })();
  const pidx = searchParams.get("pidx") || storedPidx;
  const orderId = searchParams.get("purchase_order_id");

  const check = useCallback(() => dispatch(verifyKhaltiPayment(pidx as string)), [dispatch, pidx]);

  return <PaymentStatusView gateway="Khalti" check={pidx ? check : null} orderId={orderId} />;
}
