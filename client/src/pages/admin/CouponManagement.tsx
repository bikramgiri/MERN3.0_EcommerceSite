import { useCallback, useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2, Mail, Pencil, Plus, RefreshCw, Tag, Trash2, X } from "lucide-react";
import { APIAuthenticated } from "../../http";
import { Skeleton, SkeletonContainer } from "../../global/Skeleton";
import { describeCoupon, type Coupon, type DiscountType } from "../../services/couponService";

interface CouponForm {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  startsAt: string; // yyyy-mm-dd (local)
  expiresAt: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
  firstOrderOnly: boolean;
  showToNewCustomers: boolean;
  showOnSite: boolean;
  bannerText: string;
}

const emptyForm: CouponForm = {
  code: "",
  description: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  perUserLimit: "1",
  isActive: true,
  firstOrderOnly: false,
  showToNewCustomers: false,
  showOnSite: false,
  bannerText: "",
};

const toDateInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// A coupon starts at the beginning of its start day and ends at the end of its last day (local time)
const fromDateInput = (value: string, endOfDay: boolean) =>
  value ? new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`).toISOString() : null;

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

const errorInfo = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; field?: string } | undefined;
    return { message: data?.message || fallback, field: data?.field };
  }
  return { message: fallback, field: undefined };
};

type CouponState = "Active" | "Paused" | "Scheduled" | "Expired" | "Used up";

const couponState = (coupon: Coupon): CouponState => {
  const now = Date.now();
  if (!coupon.isActive) return "Paused";
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) return "Expired";
  if (coupon.usageLimit != null && coupon.timesUsed >= coupon.usageLimit) return "Used up";
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return "Scheduled";
  return "Active";
};

const stateStyles: Record<CouponState, string> = {
  Active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  Paused: "bg-[#1A1613]/5 text-[#1A1613]/60 dark:bg-white/10 dark:text-[#F5EFE6]/60",
  Scheduled: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  Expired: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  "Used up": "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const conditions = (coupon: Coupon) => {
  const parts: string[] = [];
  if (coupon.minOrderAmount > 0) parts.push(`Min. order Rs. ${coupon.minOrderAmount.toLocaleString()}`);
  if (coupon.perUserLimit != null) parts.push(`${coupon.perUserLimit}× per customer`);
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > Date.now()) parts.push(`Starts ${formatDate(coupon.startsAt)}`);
  if (coupon.expiresAt) parts.push(`Ends ${formatDate(coupon.expiresAt)}`);
  return parts.join(" · ") || "No conditions";
};

const input =
  "w-full rounded-lg border border-[#1A1613]/15 dark:border-white/10 bg-white dark:bg-[#1E1A17] px-3 py-2 text-sm text-[#1A1613] dark:text-[#F5EFE6] placeholder:text-[#1A1613]/40 dark:placeholder:text-[#F5EFE6]/30 focus:outline-none focus:ring-2 focus:ring-[#E6540B]/30";
const label = "mb-1 block text-xs font-semibold text-[#1A1613]/70 dark:text-[#F5EFE6]/70";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-xl border border-[#1A1613]/15 dark:border-white/10 bg-[#FFFDF8] dark:bg-[#1E1A17] px-4 py-2 text-xs font-semibold text-[#1A1613] dark:text-[#F5EFE6] hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420] disabled:opacity-50 cursor-pointer";

const promoBadge =
  "rounded-full bg-[#E6540B]/10 px-2 py-0.5 text-[11px] font-semibold text-[#E6540B] dark:bg-[#E6540B]/20";

const CheckRow = ({
  checked,
  onChange,
  label: text,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}) => (
  <label className="flex cursor-pointer items-start gap-2 text-sm text-[#1A1613] dark:text-[#F5EFE6]">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 cursor-pointer accent-[#E6540B]"
    />
    <span>
      <span className="block font-medium">{text}</span>
      <span className="block text-xs text-[#1A1613]/55 dark:text-[#F5EFE6]/50">{hint}</span>
    </span>
  </label>
);

const CouponManagement = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [formError, setFormError] = useState<{ message: string; field?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [emailing, setEmailing] = useState<Coupon | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await APIAuthenticated.get("/admin/coupon");
      setCoupons(response.data.data || []);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    APIAuthenticated.get("/admin/coupon")
      .then((response) => setCoupons(response.data.data || []))
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const openForm = (coupon: Coupon | "new") => {
    setEditing(coupon);
    setFormError(null);
    setForm(
      coupon === "new"
        ? emptyForm
        : {
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: String(coupon.discountValue),
            minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : "",
            maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : "",
            startsAt: toDateInput(coupon.startsAt),
            expiresAt: toDateInput(coupon.expiresAt),
            usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
            perUserLimit: coupon.perUserLimit ? String(coupon.perUserLimit) : "",
            isActive: coupon.isActive,
            firstOrderOnly: coupon.firstOrderOnly,
            showToNewCustomers: coupon.showToNewCustomers,
            showOnSite: coupon.showOnSite,
            bannerText: coupon.bannerText || "",
          },
    );
  };

  const setField = <K extends keyof CouponForm>(key: K, value: CouponForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formError?.field === key) setFormError(null);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || !editing) return;
    setSaving(true);
    setFormError(null);
    const body = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: form.discountValue,
      minOrderAmount: form.minOrderAmount || 0,
      maxDiscountAmount: form.discountType === "PERCENT" ? form.maxDiscountAmount || null : null,
      startsAt: fromDateInput(form.startsAt, false),
      expiresAt: fromDateInput(form.expiresAt, true),
      usageLimit: form.usageLimit || null,
      perUserLimit: form.perUserLimit || null,
      isActive: form.isActive,
      firstOrderOnly: form.firstOrderOnly,
      showToNewCustomers: form.showToNewCustomers,
      showOnSite: form.showOnSite,
      bannerText: form.showOnSite ? form.bannerText.trim() : "",
    };
    try {
      if (editing === "new") {
        const response = await APIAuthenticated.post("/admin/coupon", body);
        setCoupons((prev) => [response.data.data, ...prev]);
        toast.success(`Coupon ${body.code} created`);
      } else {
        const response = await APIAuthenticated.patch(`/admin/coupon/${editing.id}`, body);
        setCoupons((prev) => prev.map((c) => (c.id === editing.id ? response.data.data : c)));
        toast.success(`Coupon ${body.code} updated`);
      }
      setEditing(null);
      // Turning on "Show on site" / "Offer to new customers" switches it off on other coupons
      if (body.showOnSite || body.showToNewCustomers) load();
    } catch (error) {
      setFormError(errorInfo(error, "Couldn't save the coupon. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    if (busyId) return;
    setBusyId(coupon.id);
    try {
      const response = await APIAuthenticated.patch(`/admin/coupon/${coupon.id}`, { isActive: !coupon.isActive });
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? response.data.data : c)));
      toast.success(coupon.isActive ? `${coupon.code} paused` : `${coupon.code} turned on`);
    } catch (error) {
      toast.error(errorInfo(error, "Couldn't update the coupon.").message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmEmail = async () => {
    if (!emailing || sendingEmail) return;
    setSendingEmail(true);
    try {
      const response = await APIAuthenticated.post(`/admin/coupon/${emailing.id}/email`);
      const lastEmailedAt = response.data.data?.lastEmailedAt ?? new Date().toISOString();
      setCoupons((prev) => prev.map((c) => (c.id === emailing.id ? { ...c, lastEmailedAt } : c)));
      toast.success(response.data.message);
      setEmailing(null);
    } catch (error) {
      toast.error(errorInfo(error, "Couldn't send the email.").message);
    } finally {
      setSendingEmail(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || busyId) return;
    setBusyId(deleting.id);
    try {
      await APIAuthenticated.delete(`/admin/coupon/${deleting.id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== deleting.id));
      toast.success(`Coupon ${deleting.code} deleted`);
      setDeleting(null);
    } catch (error) {
      toast.error(errorInfo(error, "Couldn't delete the coupon.").message);
    } finally {
      setBusyId(null);
    }
  };

  const fieldClass = (field: keyof CouponForm) =>
    `${input} ${formError?.field === field ? "border-red-400 dark:border-red-500/60" : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E6540B]/10 text-[#E6540B] dark:bg-[#E6540B]/15">
              <Tag className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1613] dark:text-[#F5EFE6] sm:text-3xl">Coupons</h1>
          </div>
          <p className="mt-1 text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50 sm:text-sm">
            Promo codes shoppers can enter at checkout. Cancelled orders and failed payments don't count as uses.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button type="button" onClick={load} disabled={loading} className={secondaryButton}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#E6540B]" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => openForm("new")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#E6540B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d44c0a]"
          >
            <Plus className="h-4 w-4" />
            New coupon
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] dark:border-white/10 dark:bg-[#1E1A17]">
        {loading && coupons.length === 0 ? (
          <SkeletonContainer label="Loading coupons" className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </SkeletonContainer>
        ) : loadFailed && coupons.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#1A1613]/70 dark:text-[#F5EFE6]/70">
            Couldn't load coupons.{" "}
            <button type="button" onClick={load} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">
              Try again
            </button>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-[#1A1613] dark:text-[#F5EFE6]">No coupons yet</p>
            <p className="mt-1 text-sm text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
              Create one, e.g. WELCOME10 for 10% off a first order.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
            {coupons.map((coupon) => {
              const state = couponState(coupon);
              return (
                <li key={coupon.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#1A1613]/5 px-2 py-0.5 font-mono text-sm font-bold text-[#1A1613] dark:bg-white/10 dark:text-[#F5EFE6]">
                        {coupon.code}
                      </span>
                      <span className="text-sm font-semibold text-[#E6540B]">{describeCoupon(coupon)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${stateStyles[state]}`}>{state}</span>
                      {coupon.showOnSite && <span className={promoBadge}>On site</span>}
                      {coupon.showToNewCustomers && <span className={promoBadge}>New customers</span>}
                      {coupon.firstOrderOnly && <span className={promoBadge}>First order only</span>}
                    </div>
                    {coupon.description && (
                      <p className="mt-1 text-sm text-[#1A1613]/80 dark:text-[#F5EFE6]/80">{coupon.description}</p>
                    )}
                    <p className="mt-0.5 text-xs text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
                      {conditions(coupon)}
                      {coupon.lastEmailedAt && ` · Emailed ${formatDate(coupon.lastEmailedAt)}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <p className="text-sm text-[#1A1613]/70 dark:text-[#F5EFE6]/70">
                      <span className="font-semibold text-[#1A1613] dark:text-[#F5EFE6]">{coupon.timesUsed}</span>
                      {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ""} used
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={coupon.isActive}
                        aria-label={coupon.isActive ? `Pause ${coupon.code}` : `Turn on ${coupon.code}`}
                        onClick={() => toggleActive(coupon)}
                        disabled={busyId === coupon.id}
                        className={`relative h-5 w-9 cursor-pointer rounded-full transition disabled:opacity-50 ${
                          coupon.isActive ? "bg-[#E6540B]" : "bg-[#1A1613]/20 dark:bg-white/20"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${coupon.isActive ? "left-[18px]" : "left-0.5"}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailing(coupon)}
                        disabled={state !== "Active"}
                        aria-label={`Email ${coupon.code} to subscribers`}
                        title={state === "Active" ? "Email to newsletter subscribers" : "Only active coupons can be emailed"}
                        className="cursor-pointer rounded-lg p-2 text-[#1A1613]/60 hover:bg-[#F4EEDF] hover:text-[#1A1613] disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#F5EFE6]/60 dark:hover:bg-[#2A2420] dark:hover:text-[#F5EFE6]"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openForm(coupon)}
                        aria-label={`Edit ${coupon.code}`}
                        className="cursor-pointer rounded-lg p-2 text-[#1A1613]/60 hover:bg-[#F4EEDF] hover:text-[#1A1613] dark:text-[#F5EFE6]/60 dark:hover:bg-[#2A2420] dark:hover:text-[#F5EFE6]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(coupon)}
                        aria-label={`Delete ${coupon.code}`}
                        className="cursor-pointer rounded-lg p-2 text-[#1A1613]/60 hover:bg-red-50 hover:text-red-700 dark:text-[#F5EFE6]/60 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={handleSave}
            noValidate
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17] sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1A1613] dark:text-[#F5EFE6]">
                {editing === "new" ? "New coupon" : `Edit ${editing.code}`}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="cursor-pointer rounded-lg p-1.5 text-[#1A1613]/60 hover:bg-[#F4EEDF] dark:text-[#F5EFE6]/60 dark:hover:bg-[#2A2420]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="coupon-code" className={label}>Code</label>
                <input
                  id="coupon-code"
                  value={form.code}
                  onChange={(e) => setField("code", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                  placeholder="WELCOME10"
                  maxLength={40}
                  className={`${fieldClass("code")} font-mono uppercase`}
                />
                {editing !== "new" && editing.timesUsed > 0 && (
                  <p className="mt-1 text-xs text-[#1A1613]/50 dark:text-[#F5EFE6]/40">Used on orders, so the code can't be renamed.</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="coupon-description" className={label}>Note for shoppers (optional)</label>
                <input
                  id="coupon-description"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="10% off your first order"
                  maxLength={200}
                  className={fieldClass("description")}
                />
              </div>
              <div>
                <label htmlFor="coupon-type" className={label}>Discount type</label>
                <select
                  id="coupon-type"
                  value={form.discountType}
                  onChange={(e) => setField("discountType", e.target.value as DiscountType)}
                  className={fieldClass("discountType")}
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed amount (Rs.)</option>
                </select>
              </div>
              <div>
                <label htmlFor="coupon-value" className={label}>
                  {form.discountType === "PERCENT" ? "Percent off" : "Amount off (Rs.)"}
                </label>
                <input
                  id="coupon-value"
                  type="number"
                  min={1}
                  max={form.discountType === "PERCENT" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => setField("discountValue", e.target.value)}
                  className={fieldClass("discountValue")}
                />
              </div>
              <div>
                <label htmlFor="coupon-min" className={label}>Minimum order (Rs.)</label>
                <input
                  id="coupon-min"
                  type="number"
                  min={0}
                  value={form.minOrderAmount}
                  onChange={(e) => setField("minOrderAmount", e.target.value)}
                  placeholder="No minimum"
                  className={fieldClass("minOrderAmount")}
                />
              </div>
              {form.discountType === "PERCENT" && (
                <div>
                  <label htmlFor="coupon-max" className={label}>Maximum discount (Rs.)</label>
                  <input
                    id="coupon-max"
                    type="number"
                    min={1}
                    value={form.maxDiscountAmount}
                    onChange={(e) => setField("maxDiscountAmount", e.target.value)}
                    placeholder="No limit"
                    className={fieldClass("maxDiscountAmount")}
                  />
                </div>
              )}
              <div>
                <label htmlFor="coupon-start" className={label}>Starts (optional)</label>
                <input
                  id="coupon-start"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setField("startsAt", e.target.value)}
                  className={fieldClass("startsAt")}
                />
              </div>
              <div>
                <label htmlFor="coupon-end" className={label}>Last day (optional)</label>
                <input
                  id="coupon-end"
                  type="date"
                  value={form.expiresAt}
                  min={form.startsAt || undefined}
                  onChange={(e) => setField("expiresAt", e.target.value)}
                  className={fieldClass("expiresAt")}
                />
              </div>
              <div>
                <label htmlFor="coupon-usage" className={label}>Total uses</label>
                <input
                  id="coupon-usage"
                  type="number"
                  min={1}
                  step={1}
                  value={form.usageLimit}
                  onChange={(e) => setField("usageLimit", e.target.value)}
                  placeholder="Unlimited"
                  className={fieldClass("usageLimit")}
                />
              </div>
              <div>
                <label htmlFor="coupon-per-user" className={label}>Uses per customer</label>
                <input
                  id="coupon-per-user"
                  type="number"
                  min={1}
                  step={1}
                  value={form.perUserLimit}
                  onChange={(e) => setField("perUserLimit", e.target.value)}
                  placeholder="Unlimited"
                  className={fieldClass("perUserLimit")}
                />
              </div>
              <fieldset className="space-y-3 rounded-xl border border-[#1A1613]/10 p-3 dark:border-white/10 sm:col-span-2">
                <legend className="px-1 text-xs font-semibold text-[#1A1613]/70 dark:text-[#F5EFE6]/70">Who sees it</legend>
                <CheckRow
                  checked={form.firstOrderOnly}
                  onChange={(v) => setField("firstOrderOnly", v)}
                  label="First order only"
                  hint="Only customers who haven't ordered before can use it."
                />
                <CheckRow
                  checked={form.showToNewCustomers}
                  onChange={(v) => setField("showToNewCustomers", v)}
                  label="Offer to new customers"
                  hint="Shown in the sign-up welcome message and at their first checkout. Replaces any other welcome coupon."
                />
                <CheckRow
                  checked={form.showOnSite}
                  onChange={(v) => setField("showOnSite", v)}
                  label="Show on site"
                  hint="A strip at the top of every storefront page. Replaces any other coupon shown there."
                />
                {form.showOnSite && (
                  <div>
                    <label htmlFor="coupon-banner" className={label}>Announcement text (optional)</label>
                    <input
                      id="coupon-banner"
                      value={form.bannerText}
                      onChange={(e) => setField("bannerText", e.target.value)}
                      placeholder="Dashain sale: 15% off everything"
                      maxLength={120}
                      className={fieldClass("bannerText")}
                    />
                    <p className="mt-1 text-xs text-[#1A1613]/50 dark:text-[#F5EFE6]/40">
                      Leave empty to describe the discount automatically. The code is added after it.
                    </p>
                  </div>
                )}
              </fieldset>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1613] dark:text-[#F5EFE6] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#E6540B]"
                />
                Active (shoppers can use it)
              </label>
            </div>

            {formError && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-500/15 dark:text-red-300">
                {formError.message}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#E6540B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d44c0a] disabled:opacity-60"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editing === "new" ? "Create coupon" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {emailing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
            <h2 className="text-lg font-bold text-[#1A1613] dark:text-[#F5EFE6]">Email {emailing.code} to subscribers?</h2>
            <p className="mt-2 text-sm text-[#1A1613]/70 dark:text-[#F5EFE6]/70">
              Everyone who confirmed their newsletter subscription gets an email with this code ({describeCoupon(emailing)}).
              Each email has an unsubscribe link.
            </p>
            {emailing.lastEmailedAt && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                Already emailed on {formatDate(emailing.lastEmailedAt)}. Sending again will email everyone a second time.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEmailing(null)} disabled={sendingEmail} className={secondaryButton}>
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEmail}
                disabled={sendingEmail}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#E6540B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d44c0a] disabled:opacity-60"
              >
                {sendingEmail && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send email
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
            <h2 className="text-lg font-bold text-[#1A1613] dark:text-[#F5EFE6]">Delete {deleting.code}?</h2>
            <p className="mt-2 text-sm text-[#1A1613]/70 dark:text-[#F5EFE6]/70">
              Shoppers won't be able to use it any more. Orders that already used it keep their discount.
              {deleting.isActive && " To stop it for now, you can pause it instead."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className={secondaryButton}>
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === deleting.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyId === deleting.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
