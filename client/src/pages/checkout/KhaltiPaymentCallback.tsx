import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { verifyKhaltiPayment } from "../../store/customer/checkoutSlice";
import { useAppDispatch } from "../../hooks/hooks";
import { OrderSummary } from "../../types/checkoutTypes";

export default function KhaltiPaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState("Verifying your Khalti payment...");
  const [orderData, setOrderData] = useState<OrderSummary | null>(null);
  const [errorDetail, setErrorDetail] = useState("");

  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      const pidxFromUrl = searchParams.get("pidx");
      const pidxFromStorage = localStorage.getItem("khaltiPidx");
      const pidx = pidxFromUrl || pidxFromStorage;

      if (!pidx) {
        setStatus("failed");
        setMessage("Payment ID not found. Please contact support.");
        toast.error("Payment ID not found. Please contact support.");
        setErrorDetail("pidx missing from URL and localStorage.");
        return;
      }

      try {
        const result = await dispatch(verifyKhaltiPayment(pidx));
        localStorage.removeItem("khaltiPidx");
        localStorage.removeItem("orderId");

        if (result?.data) setOrderData(result.data);
        setStatus("success");
        setMessage("Your order is confirmed.");
        toast.success("Payment verified! Your order is confirmed.");

        setTimeout(() => navigate("/my-orders"), 8000);
      } catch (err) {
        let msg = "Verification failed.";
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.message ?? msg;
        }
        setStatus("failed");
        setMessage("Payment verification failed. Please contact support.");
        toast.error("Payment verification failed. Please contact support.");
        setErrorDetail(msg);
      }
    };

    verify();
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="min-h-screen bg-[#faf6ec] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 w-full max-w-md p-8">
        {status === "verifying" && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-500 text-sm">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-orange-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            {orderData && (
              <div className="bg-[#faf6ec] border border-orange-200 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-mono text-xs text-gray-800">{orderData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-orange-700">
                    Rs. {orderData.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold text-orange-600">{orderData.orderStatus}</span>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400 mb-4">Redirecting to My Orders in 8 seconds...</p>
            <button
              onClick={() => navigate("/my-orders")}
              className="cursor-pointer w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              View My Orders <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {errorDetail && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
                <p className="text-xs text-red-600">{errorDetail}</p>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="cursor-pointer w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry Verification
              </button>
              <button
                onClick={() => { localStorage.removeItem("khaltiPidx"); navigate("/"); }}
                className="cursor-pointer w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
              >
                Return Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}