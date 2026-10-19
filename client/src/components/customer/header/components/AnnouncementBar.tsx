import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import {
  dismissSitePromotion,
  useDismissedPromotion,
  useSitePromotion,
} from "../../../../services/couponService";
import { useStoreSettings } from "../../../../services/storeSettingsService";

/**
 * Promo strip at the top of the storefront, e.g. "Dashain sale: 15% off · Use code DASHAIN15".
 * The admin switches it on per coupon ("Show on site"). Like the maintenance banner, it sits
 * inside the fixed header, and an invisible copy in the layout keeps content below it.
 */
const AnnouncementBar = ({ placeholder = false }: { placeholder?: boolean }) => {
  const promo = useSitePromotion();
  const dismissed = useDismissedPromotion();
  const { maintenanceMode } = useStoreSettings();
  const [copied, setCopied] = useState(false);

  // Ordering is paused during maintenance, so don't advertise a code then
  if (!promo || maintenanceMode || dismissed === promo.code) return null;

  const headline =
    promo.bannerText ||
    `${promo.discountLabel}${promo.minOrderAmount > 0 ? ` on orders over Rs. ${promo.minOrderAmount.toLocaleString("en-NP")}` : ""}${
      promo.firstOrderOnly ? " on your first order" : ""
    }`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the code is visible anyway
    }
  };

  return (
    <div
      aria-hidden={placeholder || undefined}
      className={`relative bg-[#1A1613] px-10 py-2 text-center text-xs text-[#FDF8ED] sm:text-sm ${placeholder ? "invisible" : ""}`}
    >
      <span>{headline}</span>
      <span className="mx-2 text-[#FDF8ED]/40">·</span>
      <span className="whitespace-nowrap">
        Use code{" "}
        <button
          type="button"
          onClick={copyCode}
          tabIndex={placeholder ? -1 : undefined}
          title="Copy code"
          className="inline-flex cursor-pointer items-center gap-1 rounded border border-dashed border-[#FDF8ED]/50 px-1.5 font-mono font-semibold tracking-wide hover:border-[#E6540B] hover:text-[#FFB27A]"
        >
          {promo.code}
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </span>
      <button
        type="button"
        onClick={() => dismissSitePromotion(promo.code)}
        tabIndex={placeholder ? -1 : undefined}
        aria-label="Close announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-[#FDF8ED]/70 hover:text-[#FDF8ED]"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
