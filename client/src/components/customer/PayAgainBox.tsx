import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { useAppDispatch } from "../../hooks/hooks";
import { fetchMyOrder, fetchMySingleOrder } from "../../store/customer/checkoutSlice";
import { OrderStatus, PaymentMethod, PaymentStatus, type FetchOrder } from "../../types/customer/checkoutTypes";
import { redirectToGateway, retryOrderPayment, syncOrderPayment } from "../../services/paymentService";
import { useStoreSettings } from "../../services/storeSettingsService";

const errorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message || fallback : fallback;

/**
 * Shown on an unpaid online order (payment cancelled, failed or never finished):
 * pay again with Khalti/eSewa, switch to cash on delivery, or re-check the payment.
 */
const PayAgainBox = ({ order }: { order: FetchOrder }) => {
  const dispatch = useAppDispatch();
  const settings = useStoreSettings();
  const [busy, setBusy] = useState<string | null>(null);

  const method = order.Payment?.paymentMethod;
  const status = order.Payment?.paymentStatus;
  if (order.orderStatus !== OrderStatus.Pending || method === PaymentMethod.COD || status === PaymentStatus.Paid) {
    return null;
  }

  const refresh = async () => {
    await dispatch(fetchMyOrder()).catch(() => {});
    await dispatch(fetchMySingleOrder(order.id)).catch(() => {});
  };

  const pay = async (paymentMethod: PaymentMethod) => {
    if (busy) return;
    setBusy(paymentMethod);
    try {
      const response = await retryOrderPayment(order.id, paymentMethod);
      if (response.paymentStatus === "paid") {
        toast.success("This order is already paid.");
        await refresh();
        setBusy(null);
        return;
      }
      if (paymentMethod !== PaymentMethod.COD && redirectToGateway(response)) return; // leaving the page
      toast.success("Done. You'll pay in cash when your order arrives.");
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't start the payment. Please try again."));
    }
    setBusy(null);
  };

  const checkAgain = async () => {
    if (busy) return;
    setBusy("check");
    try {
      const result = await syncOrderPayment(order.id);
      if (result.paymentStatus === "paid") toast.success("Payment confirmed. Your order is being prepared.");
      else if (result.paymentStatus === "pending") toast.info("The payment still hasn't finished.");
      else toast.info("The payment wasn't completed.");
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't check the payment right now."));
    }
    setBusy(null);
  };

  const button =
    "inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[#1A1613]">
      <p className="font-semibold">
        {status === PaymentStatus.Failed ? "Your payment wasn't completed" : "Waiting for your payment"}
      </p>
      <p className="mt-1 text-sm text-[#1A1613]/70">
        Your order is saved but not paid yet. Pay now, or switch to cash on delivery and pay when it arrives.
        {order.paymentDueAt && (
          <>
            {" "}
            If it isn't paid by{" "}
            <strong>
              {new Date(order.paymentDueAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </strong>
            , we'll cancel it and put the items back on sale.
          </>
        )}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {settings.enableOnlinePayment && (
          <>
            <button type="button" onClick={() => pay(PaymentMethod.Khalti)} disabled={!!busy} className={`${button} bg-[#E6540B] text-white hover:bg-[#c94806]`}>
              {busy === PaymentMethod.Khalti && <Loader2 size={16} className="animate-spin" />}
              Pay with Khalti
            </button>
            <button type="button" onClick={() => pay(PaymentMethod.Esewa)} disabled={!!busy} className={`${button} bg-[#E6540B] text-white hover:bg-[#c94806]`}>
              {busy === PaymentMethod.Esewa && <Loader2 size={16} className="animate-spin" />}
              Pay with eSewa
            </button>
          </>
        )}
        {settings.enableCod && (
          <button type="button" onClick={() => pay(PaymentMethod.COD)} disabled={!!busy} className={`${button} border border-[#1A1613]/20 bg-white hover:border-[#E6540B] hover:text-[#E6540B]`}>
            {busy === PaymentMethod.COD && <Loader2 size={16} className="animate-spin" />}
            Pay on delivery instead
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={checkAgain}
        disabled={!!busy}
        className="mt-3 cursor-pointer text-sm font-medium text-[#1A1613]/70 underline hover:text-[#E6540B] disabled:opacity-50"
      >
        {busy === "check" ? "Checking..." : "Already paid? Check payment status"}
      </button>
    </div>
  );
};

export default PayAgainBox;
