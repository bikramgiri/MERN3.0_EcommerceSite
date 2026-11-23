import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Copy, Download, Loader2, Mail, MailX, MinusCircle, RefreshCw, Search, Trash2, TrendingUp, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { APIAuthenticated } from "../../http";
import { Skeleton } from "../../global/Skeleton";
import { connectSocket } from "../../services/socket";
import type { NewsletterListResponse, NewsletterStatus, NewsletterSubscriber } from "../../types/admin/newsletterTypes";

const PAGE_SIZE = 10;

type Tab = "ALL" | NewsletterStatus;
type Sort = "newest" | "oldest";
type PendingAction = { kind: "delete" | "unsubscribe"; subscriber: NewsletterSubscriber } | { kind: "expired" };

const card = "rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] dark:border-white/10 dark:bg-[#1E1A17]";
const muted = "text-[#1A1613]/60 dark:text-[#F5EFE6]/55";
const strong = "text-[#1A1613] dark:text-[#F5EFE6]";
const control =
  "rounded-lg border border-[#1A1613]/15 bg-white px-3 py-2 text-sm text-[#1A1613] focus:outline-none focus:ring-2 focus:ring-[#E6540B]/30 dark:border-white/10 dark:bg-[#14110F] dark:text-[#F5EFE6] dark:scheme-dark";
const secondaryButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/15 bg-[#FFFDF8] px-3 py-1.5 text-sm font-medium text-[#1A1613] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1E1A17] dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]";
const primaryButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#E6540B] px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[#CF4A09] disabled:cursor-not-allowed disabled:opacity-50";
const iconButton =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#1A1613]/60 hover:bg-[#F4EEDF] hover:text-[#1A1613] dark:text-[#F5EFE6]/60 dark:hover:bg-[#2A2420] dark:hover:text-[#F5EFE6]";

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PENDING", label: "Pending" },
  { key: "UNSUBSCRIBED", label: "Unsubscribed" },
];

const STATUS: Record<NewsletterStatus, { label: string; tone: string }> = {
  CONFIRMED: { label: "Confirmed", tone: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400" },
  PENDING: { label: "Pending", tone: "bg-amber-500/10 text-amber-800 dark:text-amber-400" },
  UNSUBSCRIBED: { label: "Unsubscribed", tone: "bg-[#1A1613]/5 text-[#1A1613]/70 dark:bg-white/10 dark:text-[#F5EFE6]/70" },
};

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const errorMessage = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message || fallback : fallback;

// Quote every cell and neutralise leading formula characters (CSV injection)
const csvCell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;

const NewsletterSubscribers: React.FC = () => {
  const [tab, setTab] = useState<Tab>("ALL");
  const [recentOnly, setRecentOnly] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  // Bumped to reload the same page (Refresh button, live updates, after an action)
  const [reloadTick, setReloadTick] = useState(0);

  const [result, setResult] = useState<{ key: string; data: NewsletterListResponse } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = { tab, recent: recentOnly, search, sort, page };
  const requestKey = `${JSON.stringify(query)}#${reloadTick}`;
  const loading = result?.key !== requestKey && failure?.key !== requestKey;
  const reload = () => setReloadTick((t) => t + 1);

  // Wait until typing pauses before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Every filter or page change asks the server for that page
  useEffect(() => {
    let ignore = false; // a slower, older response must not replace a newer one
    const [params] = requestKey.split("#");
    const q = JSON.parse(params) as typeof query;
    APIAuthenticated.get<NewsletterListResponse>("/admin/newsletter", {
      params: {
        tab: q.tab === "ALL" ? undefined : q.tab,
        recent: q.recent || undefined,
        search: q.search || undefined,
        sort: q.sort,
        page: q.page,
        limit: PAGE_SIZE,
      },
    })
      .then((res) => {
        if (!ignore) setResult({ key: requestKey, data: res.data });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        const message = errorMessage(err, "Couldn't load subscribers.");
        setFailure({ key: requestKey, message });
        // Keep the list on screen when a later refresh fails
        if (result) toast.error(message);
      });
    return () => {
      ignore = true;
    };
    // `result` is only read to decide whether to toast; it must not trigger a new request
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  useEffect(() => {
    // Sign-ups, confirmations and unsubscribes show up without refreshing (one reload per burst)
    const socket = connectSocket();
    const refresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => setReloadTick((t) => t + 1), 800);
    };
    socket.on("admin:newsletter-changed", refresh);
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      socket.off("admin:newsletter-changed", refresh);
    };
  }, []);

  const changeTab = (next: Tab) => {
    setTab(next);
    setRecentOnly(false);
    setPage(1);
  };
  const toggleRecent = () => {
    if (recentOnly) {
      setRecentOnly(false);
    } else {
      setTab("CONFIRMED");
      setRecentOnly(true);
    }
    setPage(1);
  };
  const resetFilters = () => {
    setTab("ALL");
    setRecentOnly(false);
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const data = result?.data;
  const stats = data?.stats;
  const counts = data?.counts;
  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const currentPage = data?.currentPage ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const firstLoad = !result && !failure;
  const filtered = search !== "" || tab !== "ALL" || recentOnly;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  // Only confirmed people may be emailed, so only they are copied or exported (matching the search)
  const mailableCount = tab === "ALL" || tab === "CONFIRMED" ? (recentOnly ? total : counts?.CONFIRMED ?? 0) : 0;

  const fetchMailable = async () => {
    const res = await APIAuthenticated.get<{ data: { email: string; confirmedAt: string | null }[] }>("/admin/newsletter/export", {
      params: { search: search || undefined, recent: recentOnly || undefined },
    });
    return res.data.data;
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const list = await fetchMailable();
      if (!list.length) {
        toast.info("No confirmed emails to export.");
        return;
      }
      const lines = list.map((s) => [csvCell(s.email), csvCell(s.confirmedAt ? new Date(s.confirmedAt).toISOString() : "")].join(","));
      const url = URL.createObjectURL(new Blob([["email,confirmed_at", ...lines].join("\r\n")], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      const d = new Date();
      link.href = url;
      link.download = `subscribers-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success(`Downloaded ${plural(list.length, "confirmed email")}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't export. Please try again."));
    } finally {
      setExporting(false);
    }
  };

  const copyEmails = async () => {
    setExporting(true);
    try {
      const list = await fetchMailable();
      if (!list.length) {
        toast.info("No confirmed emails to copy.");
        return;
      }
      await navigator.clipboard.writeText(list.map((s) => s.email).join(", "));
      toast.success(`Copied ${plural(list.length, "confirmed email")}.`);
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? errorMessage(err, "Couldn't load the emails.") : "Couldn't copy. Your browser blocked the clipboard.");
    } finally {
      setExporting(false);
    }
  };

  const runPending = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === "expired") {
        const res = await APIAuthenticated.delete<{ message: string }>("/admin/newsletter/expired");
        toast.success(res.data.message);
      } else if (pending.kind === "unsubscribe") {
        const res = await APIAuthenticated.patch<{ message: string }>(`/admin/newsletter/${pending.subscriber.id}/unsubscribe`);
        toast.success(res.data.message);
      } else {
        await APIAuthenticated.delete(`/admin/newsletter/${pending.subscriber.id}`);
        toast.success(`${pending.subscriber.email} removed.`);
      }
      setPending(null);
      reload();
    } catch (err) {
      // Already gone (another admin removed it): just refresh
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        toast.info("That subscriber was already removed.");
        setPending(null);
        reload();
      } else {
        toast.error(errorMessage(err, "Something went wrong. Please try again."));
      }
    } finally {
      setBusy(false);
    }
  };

  const statusDetail = (s: NewsletterSubscriber) => {
    if (s.status === "CONFIRMED") return s.confirmedAt ? `Since ${formatDate(s.confirmedAt)}` : "";
    if (s.status === "UNSUBSCRIBED") return s.unsubscribedAt ? `On ${formatDate(s.unsubscribedAt)}` : "";
    if (s.linkExpired) return s.confirmLinkExpiresAt ? `Link expired ${formatDate(s.confirmLinkExpiresAt)}` : "Link expired";
    return `Link valid until ${formatDate(s.confirmLinkExpiresAt)}`;
  };

  const statusBadge = (s: NewsletterSubscriber) => (
    <div>
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[s.status]?.tone ?? STATUS.PENDING.tone}`}>
        {STATUS[s.status]?.label ?? s.status}
      </span>
      <p className={`mt-0.5 text-xs ${s.linkExpired ? "text-red-700 dark:text-red-400" : muted}`}>{statusDetail(s)}</p>
    </div>
  );

  const actions = (s: NewsletterSubscriber) => (
    <div className="flex items-center justify-end gap-0.5">
      {s.status === "CONFIRMED" && (
        <a href={`mailto:${s.email}`} className={iconButton} aria-label={`Email ${s.email}`} title="Write an email">
          <Mail className="h-4 w-4" />
        </a>
      )}
      {s.status !== "UNSUBSCRIBED" && (
        <button type="button" onClick={() => setPending({ kind: "unsubscribe", subscriber: s })} className={iconButton} aria-label={`Stop emails to ${s.email}`} title="Stop emails (keeps the record)">
          <MailX className="h-4 w-4" />
        </button>
      )}
      <button type="button" onClick={() => setPending({ kind: "delete", subscriber: s })} className={`${iconButton} hover:text-red-700 dark:hover:text-red-400`} aria-label={`Remove ${s.email}`} title="Remove">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const cards = [
    {
      label: "Confirmed",
      value: stats?.confirmed ?? 0,
      hint: "Get newsletters and coupons",
      icon: CheckCircle2,
      tone: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
      active: tab === "CONFIRMED" && !recentOnly,
      onClick: () => changeTab(tab === "CONFIRMED" && !recentOnly ? "ALL" : "CONFIRMED"),
    },
    {
      label: "New in 30 days",
      value: stats?.new30 ?? 0,
      hint: `${stats?.new7 ?? 0} in the last 7 days`,
      icon: TrendingUp,
      tone: "bg-[#E6540B]/10 text-[#E6540B] dark:bg-[#E6540B]/15",
      active: recentOnly,
      onClick: toggleRecent,
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0,
      hint: stats?.expired ? `${stats.expired} with an expired link` : "Haven't clicked the email link yet",
      icon: Clock,
      tone: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
      active: tab === "PENDING",
      onClick: () => changeTab(tab === "PENDING" ? "ALL" : "PENDING"),
    },
    {
      label: "Unsubscribed",
      value: stats?.unsubscribed ?? 0,
      hint: "Won't get any emails",
      icon: MinusCircle,
      tone: "bg-[#1A1613]/5 text-[#1A1613]/70 dark:bg-white/10 dark:text-[#F5EFE6]/70",
      active: tab === "UNSUBSCRIBED",
      onClick: () => changeTab(tab === "UNSUBSCRIBED" ? "ALL" : "UNSUBSCRIBED"),
    },
  ];

  const noSubscribersAtAll = stats && stats.confirmed + stats.pending + stats.unsubscribed === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold sm:text-3xl ${strong}`}>Subscribers</h1>
          <p className={`mt-1 text-sm ${muted}`}>People on your newsletter list. Only confirmed emails get newsletters and coupon emails.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={reload} disabled={loading} className={secondaryButton}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button type="button" onClick={copyEmails} disabled={!mailableCount || exporting} className={secondaryButton} title="Copy the confirmed emails that match the search">
            <Copy className="h-4 w-4" /> Copy emails
          </button>
          <button type="button" onClick={exportCsv} disabled={!mailableCount || exporting} className={primaryButton} title="Download the confirmed emails that match the search">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV
          </button>
        </div>
      </div>

      {!result && failure ? (
        <div className={`${card} p-10 text-center text-sm ${muted}`}>
          {failure.message}{" "}
          <button type="button" onClick={reload} disabled={loading} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">Try again</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {cards.map((stat) => {
              const Icon = stat.icon;
              return (
                <button
                  key={stat.label}
                  type="button"
                  onClick={stat.onClick}
                  aria-pressed={stat.active}
                  className={`${card} cursor-pointer p-4 text-left transition hover:border-[#1A1613]/25 dark:hover:border-white/25 ${stat.active ? "border-[#E6540B]! ring-2 ring-[#E6540B]/15" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm ${muted}`}>{stat.label}</p>
                      {firstLoad ? <Skeleton className="mt-1 h-7 w-12" /> : <p className={`mt-1 text-2xl font-bold ${strong}`}>{stat.value.toLocaleString()}</p>}
                    </div>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}><Icon className="h-4 w-4" /></span>
                  </div>
                  <p className={`mt-1 text-xs ${muted}`}>{stat.active ? "Showing these · click to show all" : stat.hint}</p>
                </button>
              );
            })}
          </div>

          <section className={card}>
            <div className="space-y-3 border-b border-[#1A1613]/10 p-4 dark:border-white/10">
              <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Status">
                {TABS.map((t) => {
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => changeTab(t.key)}
                      className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        active ? "bg-[#1A1613] text-white dark:bg-[#F5EFE6] dark:text-[#1A1613]" : "text-[#1A1613]/70 hover:bg-[#F4EEDF] dark:text-[#F5EFE6]/70 dark:hover:bg-[#2A2420]"
                      }`}
                    >
                      {t.label} {counts && <span className="opacity-60">{counts[t.key].toLocaleString()}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1613]/40 dark:text-[#F5EFE6]/40" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by email"
                    aria-label="Search subscribers"
                    maxLength={100}
                    className={`${control} w-full pl-9`}
                  />
                </div>
                {recentOnly && (
                  <button type="button" onClick={toggleRecent} className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-full bg-[#E6540B]/10 px-3 py-1 text-xs font-semibold text-[#E6540B]">
                    Confirmed in the last 30 days <X className="h-3 w-3" />
                  </button>
                )}
                <select value={sort} onChange={(e) => { setSort(e.target.value as Sort); setPage(1); }} aria-label="Sort" className={`${control} cursor-pointer sm:ml-auto`}>
                  <option value="newest">Newest sign-ups first</option>
                  <option value="oldest">Oldest sign-ups first</option>
                </select>
              </div>
            </div>

            {/* Expired sign-ups can never confirm; offer to clear them out */}
            {tab === "PENDING" && (stats?.expired ?? 0) > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1613]/10 bg-amber-500/5 px-4 py-2.5 text-sm dark:border-white/10">
                <span className={strong}>
                  {plural(stats?.expired ?? 0, "sign-up")} never confirmed and the link has expired. They can sign up again any time.
                </span>
                <button type="button" onClick={() => setPending({ kind: "expired" })} className={`${secondaryButton} py-1`}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove expired
                </button>
              </div>
            )}

            {firstLoad ? (
              <div className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-4">
                    <Skeleton className="h-4 w-56 max-w-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : noSubscribersAtAll ? (
              <div className="p-10 text-center">
                <p className={`font-semibold ${strong}`}>No subscribers yet</p>
                <p className={`mt-1 text-sm ${muted}`}>People who sign up in the store footer appear here.</p>
              </div>
            ) : rows.length === 0 ? (
              <div className={`p-10 text-center text-sm ${muted}`}>
                {loading ? "Loading…" : "No subscribers match."}{" "}
                {!loading && filtered && <button type="button" onClick={resetFilters} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">Show all</button>}
              </div>
            ) : (
              <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                {/* Phones */}
                <ul className="divide-y divide-[#1A1613]/8 md:hidden dark:divide-white/10">
                  {rows.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0 space-y-1.5">
                        <p className={`break-all text-sm font-semibold ${strong}`}>{s.email}</p>
                        {statusBadge(s)}
                        <p className={`text-xs ${muted}`}>Signed up {formatDate(s.createdAt)}</p>
                      </div>
                      {actions(s)}
                    </li>
                  ))}
                </ul>

                {/* Larger screens */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b border-[#1A1613]/10 text-left text-xs font-semibold dark:border-white/10 ${muted}`}>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Signed up</th>
                        <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
                      {rows.map((s) => (
                        <tr key={s.id} className="hover:bg-[#F4EEDF]/40 dark:hover:bg-white/5">
                          <td className={`max-w-xs truncate px-4 py-3 font-medium ${strong}`} title={s.email}>{s.email}</td>
                          <td className="px-4 py-3">{statusBadge(s)}</td>
                          <td className={`whitespace-nowrap px-4 py-3 ${muted}`}>{formatDate(s.createdAt)}</td>
                          <td className="px-4 py-3">{actions(s)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={`flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1613]/10 px-4 py-3 text-sm dark:border-white/10 ${muted}`}>
                  <span>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total.toLocaleString()}</span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1 || loading} className={secondaryButton}>Previous</button>
                      <span>Page {currentPage} of {totalPages}</span>
                      <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages || loading} className={secondaryButton}>Next</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <p className={`text-xs ${muted}`}>
            New sign-ups get an email with a link to confirm (valid for 48 hours). Every newsletter has an unsubscribe link.
            Copy and Export include every confirmed email that matches the search, not just this page.
          </p>
        </>
      )}

      {pending && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
            <h2 className={`wrap-break-word text-lg font-bold ${strong}`}>
              {pending.kind === "expired"
                ? `Remove ${plural(stats?.expired ?? 0, "expired sign-up")}?`
                : pending.kind === "unsubscribe"
                  ? `Stop emails to ${pending.subscriber.email}?`
                  : `Remove ${pending.subscriber.email}?`}
            </h2>
            <p className={`mt-2 text-sm ${muted}`}>
              {pending.kind === "expired"
                ? "These people never clicked the confirmation link. They won't get any emails either way."
                : pending.kind === "unsubscribe"
                  ? "They'll be marked as unsubscribed and won't get newsletters or coupon emails. They can sign up again themselves."
                  : pending.subscriber.status === "CONFIRMED"
                    ? "They'll stop getting emails and the record is deleted. To keep a record that they opted out, use Stop emails instead."
                    : "The record is deleted. This can't be undone."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)} disabled={busy} className={secondaryButton}>Cancel</button>
              <button
                type="button"
                onClick={runPending}
                disabled={busy}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white disabled:opacity-60 ${pending.kind === "unsubscribe" ? "bg-[#1A1613] hover:bg-black dark:bg-[#F5EFE6] dark:text-[#1A1613]" : "bg-red-600 hover:bg-red-700"}`}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending.kind === "unsubscribe" ? "Stop emails" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterSubscribers;
