import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle2, Loader2, MailX, XCircle } from "lucide-react";
import { API } from "../../../http";

type Result =
  | { state: "loading" }
  | { state: "success"; message: string; email?: string; alreadyConfirmed?: boolean }
  | { state: "error"; message: string };

const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

/**
 * Sends the token from the email link to the API once (even under StrictMode's
 * double effects, since confirmation tokens can only be used once).
 */
const useTokenAction = (endpoint: string, missingTokenMessage: string): Result => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [result, setResult] = useState<Result>({ state: "loading" });
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;
    API.post(endpoint, { token })
      .then((res) =>
        setResult({
          state: "success",
          message: res.data.message,
          email: res.data.email,
          alreadyConfirmed: res.data.alreadyConfirmed,
        }),
      )
      .catch((error) =>
        setResult({ state: "error", message: errorMessage(error, "Something went wrong. Please try again.") }),
      );
  }, [endpoint, token]);

  return token ? result : { state: "error", message: missingTokenMessage };
};

const StatusCard = ({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) => (
  <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-12">
      <div
        role="status"
        className="w-full rounded-2xl border border-[#1A1613]/10 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">{icon}</div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="mt-3 text-[#1A1613]/70">{children}</div>
      </div>
    </div>
  </div>
);

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#E6540B] px-5 py-2.5 font-semibold text-white transition hover:bg-[#c94806] disabled:cursor-not-allowed disabled:opacity-70";

export const NewsletterConfirm = () => {
  const result = useTokenAction(
    "/customer/newsletter/confirm",
    "This confirmation link is incomplete. Please use the link from your email.",
  );

  if (result.state === "loading") {
    return (
      <StatusCard
        icon={<Loader2 className="h-10 w-10 animate-spin text-[#E6540B]" />}
        title="Confirming your subscription..."
      >
        <p>This only takes a moment.</p>
      </StatusCard>
    );
  }

  if (result.state === "error") {
    return (
      <StatusCard icon={<XCircle className="h-12 w-12 text-red-500" />} title="Link not valid">
        <p>{result.message}</p>
        <p className="mt-2 text-sm">You can subscribe again from the form at the bottom of any page.</p>
        <Link to="/" className={`${primaryButton} mt-6`}>
          Go to homepage
        </Link>
      </StatusCard>
    );
  }

  return (
    <StatusCard
      icon={<CheckCircle2 className="h-12 w-12 text-green-600" />}
      title="You're subscribed!"
    >
      <p>{result.message}</p>
      {result.email && !result.alreadyConfirmed && (
        <p className="mt-2 text-sm">
          We've sent a welcome email to <strong>{result.email}</strong>.
        </p>
      )}
      <Link to="/products" className={`${primaryButton} mt-6`}>
        Start shopping
      </Link>
    </StatusCard>
  );
};

export const NewsletterUnsubscribe = () => {
  const result = useTokenAction(
    "/customer/newsletter/unsubscribe",
    "This unsubscribe link is incomplete. Please use the link from our email.",
  );
  const [isResubscribing, setIsResubscribing] = useState(false);

  const handleResubscribe = async (email: string) => {
    setIsResubscribing(true);
    try {
      const res = await API.post("/customer/newsletter", { email });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't subscribe right now. Please try again."));
    } finally {
      setIsResubscribing(false);
    }
  };

  if (result.state === "loading") {
    return (
      <StatusCard
        icon={<Loader2 className="h-10 w-10 animate-spin text-[#E6540B]" />}
        title="Unsubscribing..."
      >
        <p>This only takes a moment.</p>
      </StatusCard>
    );
  }

  if (result.state === "error") {
    return (
      <StatusCard icon={<XCircle className="h-12 w-12 text-red-500" />} title="Link not valid">
        <p>{result.message}</p>
        <Link to="/faq" className={`${primaryButton} mt-6`}>
          Get help
        </Link>
      </StatusCard>
    );
  }

  return (
    <StatusCard icon={<MailX className="h-12 w-12 text-[#1A1613]/60" />} title="You're unsubscribed">
      <p>{result.message}</p>
      {result.email && (
        <>
          <p className="mt-2 text-sm">
            <strong>{result.email}</strong> has been removed from our mailing list.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleResubscribe(result.email!)}
              disabled={isResubscribing}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1A1613]/20 px-5 py-2.5 font-semibold transition hover:border-[#E6540B] hover:text-[#E6540B] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isResubscribing && <Loader2 className="h-4 w-4 animate-spin" />}
              Subscribe again
            </button>
            <Link to="/" className={primaryButton}>
              Go to homepage
            </Link>
          </div>
        </>
      )}
    </StatusCard>
  );
};
