import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useAppDispatch } from "../../../hooks/hooks";
import { fetchMyOrder } from "../../../store/customer/checkoutSlice";
import type { PaymentCheckResponse } from "../../../services/paymentService";
import { formatCurrency } from "../../../utils/helpers";
import usePageTitle from "../../../hooks/usePageTitle";

type ViewState =
  | { kind: "checking" }
  | { kind: "paid" | "pending" | "failed"; orderId: string; amount: number }
  | { kind: "error"; message: string };

const primary =
  "inline-flex w-full items-center justify-center rounded-lg bg-[#E6540B] px-4 py-3 font-semibold text-white hover:bg-[#c94806]";
const secondary =
  "inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-[#1A1613]/15 px-4 py-3 font-semibold hover:border-[#E6540B] hover:text-[#E6540B] disabled:cursor-not-allowed disabled:opacity-50";

const clearPendingPayment = () => {
  try {
    localStorage.removeItem("orderId");
    localStorage.removeItem("khaltiPidx");
  } catch {
    // nothing to clear
  }
};

/**
 * Shared result page after Khalti/eSewa sends the shopper back. The server checks
 * the payment with the gateway; this page only shows what it says.
 */
const PaymentStatusView = ({
  gateway,
  check,
  orderId: knownOrderId,
}: {
  gateway: "Khalti" | "eSewa";
  /** Asks the server for the payment result; null means there's nothing to check */
  check: (() => Promise<PaymentCheckResponse | undefined>) | null;
  orderId?: string | null;
}) => {
  usePageTitle(`${gateway} payment`);
  const dispatch = useAppDispatch();
  const [state, setState] = useState<ViewState>(() =>
    check
      ? { kind: "checking" }
      : knownOrderId
        ? { kind: "failed", orderId: knownOrderId, amount: 0 }
        : { kind: "error", message: "We couldn't find the payment details for this page." },
  );
  const [rechecking, setRechecking] = useState(false);
  const started = useRef(false);

  const run = useCallback(async () => {
    if (!check) return;
    try {
      const response = await check();
      if (!response?.paymentStatus) throw new Error("Unexpected response");
      const orderId = response.data?.id || knownOrderId || "";
      setState({ kind: response.paymentStatus, orderId, amount: Number(response.data?.totalAmount) || 0 });
      if (response.paymentStatus !== "pending") clearPendingPayment();
      dispatch(fetchMyOrder()).catch(() => {});
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setState({ kind: "error", message: message || `We couldn't confirm your ${gateway} payment right now.` });
    }
  }, [check, dispatch, gateway, knownOrderId]);

  // Runs once; the gateway result must not be checked twice in parallel
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
  }, [run]);

  const recheck = async () => {
    setRechecking(true);
    await run();
    setRechecking(false);
  };

  const orderLink = (id: string) => (id ? `/my-orders/orderdetails/${id}` : "/my-orders");

  return (
    <div className="bg-[#FDF8ED] px-4 pb-16 pt-28 text-[#1A1613]">
      <div className="mx-auto max-w-md rounded-xl border border-[#1A1613]/10 bg-white p-6 text-center sm:p-8">
        {state.kind === "checking" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#E6540B]" />
            <h1 className="mt-4 text-xl font-bold">Confirming your payment</h1>
            <p className="mt-1 text-sm text-[#1A1613]/60">Checking with {gateway}. This only takes a moment.</p>
          </>
        )}

        {state.kind === "paid" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-xl font-bold">Payment received</h1>
            <p className="mt-1 text-sm text-[#1A1613]/60">
              {state.amount > 0 && <>We received {formatCurrency(state.amount)} through {gateway}. </>}
              Your order is now being prepared.
            </p>
            <div className="mt-6 space-y-2">
              <Link to={orderLink(state.orderId)} className={primary}>
                View order
              </Link>
              <Link to="/products" className={secondary}>
                Continue shopping
              </Link>
            </div>
          </>
        )}

        {state.kind === "pending" && (
          <>
            <Clock className="mx-auto h-12 w-12 text-amber-600" />
            <h1 className="mt-4 text-xl font-bold">Payment still processing</h1>
            <p className="mt-1 text-sm text-[#1A1613]/60">
              {gateway} hasn't confirmed your payment yet. Your order is saved; check again in a minute.
            </p>
            <div className="mt-6 space-y-2">
              <button type="button" onClick={recheck} disabled={rechecking} className={`${primary} cursor-pointer disabled:opacity-60`}>
                {rechecking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check again"}
              </button>
              <Link to={orderLink(state.orderId)} className={secondary}>
                View order
              </Link>
            </div>
          </>
        )}

        {state.kind === "failed" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="mt-4 text-xl font-bold">Payment not completed</h1>
            <p className="mt-1 text-sm text-[#1A1613]/60">
              The {gateway} payment was cancelled or didn't go through, so no money was taken. Your order is saved:
              you can pay again or switch to cash on delivery.
            </p>
            <div className="mt-6 space-y-2">
              <Link to={orderLink(state.orderId)} className={primary}>
                Pay again or change payment
              </Link>
              <Link to="/" className={secondary}>
                Back to home
              </Link>
            </div>
          </>
        )}

        {state.kind === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="mt-4 text-xl font-bold">We couldn't confirm your payment</h1>
            <p className="mt-1 text-sm text-[#1A1613]/60">{state.message}</p>
            <p className="mt-2 text-sm text-[#1A1613]/60">
              If money was taken, don't worry: your order will update once {gateway} confirms it.
            </p>
            <div className="mt-6 space-y-2">
              {check && (
                <button type="button" onClick={recheck} disabled={rechecking} className={`${primary} cursor-pointer disabled:opacity-60`}>
                  {rechecking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Try again"}
                </button>
              )}
              <Link to="/my-orders" className={secondary}>
                My orders
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusView;
