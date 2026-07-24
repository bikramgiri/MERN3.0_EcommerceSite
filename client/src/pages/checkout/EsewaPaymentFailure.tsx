import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, RefreshCw, Home, ArrowLeft, AlertTriangle } from "lucide-react";

export default function EsewaPaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status") || "FAILED";
  const errorMessage = searchParams.get("message") || null;
  const txnId = searchParams.get("transaction_uuid") || null;

  return (
    <div className="py-10 bg-[#faf6ec] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="text-xl font-serif font-bold text-gray-900">Payment Failed</h1>
          <p className="text-sm text-gray-500 mt-1.5 max-w-xs">
            Your eSewa payment could not be processed. No amount has been charged.
          </p>
        </div>

        <div className="bg-[#faf6ec] rounded-xl border border-orange-100 p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Payment Method</span>
            <span className="font-semibold text-gray-700">eSewa</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <XCircle className="w-3 h-3" />
              {status}
            </span>
          </div>
          {txnId && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-xs text-gray-600 break-all text-right max-w-[180px]">
                {txnId}
              </span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-start gap-2 pt-2 border-t border-orange-100">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            What can you do?
          </p>
          <ul className="space-y-2">
            {[
              "Check your eSewa account balance",
              "Ensure your internet connection is stable",
              "Try again or use a different payment method",
              "Contact eSewa support if the issue persists",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-2" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/checkout")}
            className="cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => navigate("/my-orders")}
            className="cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            My Orders
          </button>
          <button
            onClick={() => navigate("/")}
            className="cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-gray-400 text-sm hover:text-gray-600 transition"
          >
            <Home className="w-4 h-4" />
            Return Home
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Need help?{" "}
          <a
            href="https://esewa.com.np/home/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:underline"
          >
            Contact eSewa support
          </a>
        </p>
      </div>
    </div>
  );
}