import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../../hooks/hooks";
import { verifyEsewaPayment } from "../../../store/customer/checkoutSlice";
import type { DecodedData } from "../../../types/customer/checkoutTypes";
import PaymentStatusView from "./PaymentStatusView";

// eSewa sends the shopper back here with ?data=<base64 JSON>. The server re-checks
// the payment with eSewa itself, so nothing in this data is trusted.
export default function EsewaPaymentCallback() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const encoded = searchParams.get("data");

  const decoded = useMemo(() => {
    if (!encoded) return null;
    try {
      return JSON.parse(atob(encoded)) as DecodedData;
    } catch {
      return null;
    }
  }, [encoded]);

  const check = useCallback(() => dispatch(verifyEsewaPayment(decoded as DecodedData)), [dispatch, decoded]);

  return <PaymentStatusView gateway="eSewa" check={decoded?.transaction_uuid ? check : null} />;
}
