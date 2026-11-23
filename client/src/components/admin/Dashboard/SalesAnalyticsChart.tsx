import React, { useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { DailySales } from "../../../types/admin/datasTypes";
import { Skeleton } from "../../../global/Skeleton";
import { useTheme } from "../../../context/ThemeContext";

type Range = "7d" | "30d" | "12m";
type Metric = "revenue" | "orders";

const RANGES: { key: Range; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "12m", label: "12 months" },
];

interface Bucket {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

// Dates are handled as plain calendar days in the store's timezone ("YYYY-MM-DD" from the
// server), so the chart shows the same days whatever timezone the admin's browser is in
const parseDay = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
};
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const utcLabel = (d: Date, options: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", { ...options, timeZone: "UTC" });

/** Empty buckets ending today; offset 1 = the same-length period just before */
const buildBuckets = (range: Range, today: Date, offset = 0): Bucket[] => {
  if (range === "12m") {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (11 - i) - offset * 12, 1));
      return { key: isoDay(d).slice(0, 7), label: utcLabel(d, { month: "short" }), revenue: 0, orders: 0 };
    });
  }
  const days = range === "7d" ? 7 : 30;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i + offset * days) * 86400000);
    return {
      key: isoDay(d),
      label: utcLabel(d, range === "7d" ? { weekday: "short" } : { month: "short", day: "numeric" }),
      revenue: 0,
      orders: 0,
    };
  });
};

const fill = (buckets: Bucket[], rows: DailySales[], range: Range) => {
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const row of rows) {
    const bucket = byKey.get(range === "12m" ? row.day.slice(0, 7) : row.day);
    if (!bucket) continue;
    bucket.orders += row.orders;
    bucket.revenue += row.revenue;
  }
  return buckets;
};

const SalesAnalyticsChart: React.FC<{ dailySales?: DailySales[]; today?: string; loading?: boolean }> = ({
  dailySales = [],
  today,
  loading = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [metric, setMetric] = useState<Metric>("revenue");
  const [range, setRange] = useState<Range>("30d");

  const { current, totals, previousTotals } = useMemo(() => {
    const todayDate = parseDay(today || new Date().toISOString().slice(0, 10));
    const currentBuckets = fill(buildBuckets(range, todayDate), dailySales, range);
    const previousBuckets = fill(buildBuckets(range, todayDate, 1), dailySales, range);
    const sum = (buckets: Bucket[]) =>
      buckets.reduce((acc, b) => ({ revenue: acc.revenue + b.revenue, orders: acc.orders + b.orders }), { revenue: 0, orders: 0 });
    return { current: currentBuckets, totals: sum(currentBuckets), previousTotals: sum(previousBuckets) };
  }, [dailySales, today, range]);

  const value = totals[metric];
  const previous = previousTotals[metric];
  const change = previous > 0 ? Math.round(((value - previous) / previous) * 100) : null;
  const formatValue = (n: number) => (metric === "revenue" ? `Rs ${Math.round(n).toLocaleString()}` : n.toLocaleString());
  const rangeLabel = RANGES.find((r) => r.key === range)!.label;

  const color = metric === "revenue" ? "#E6540B" : isDark ? "#4FA37C" : "#2F6B4F";
  const axis = isDark ? "rgba(245, 239, 230, 0.55)" : "rgba(26, 22, 19, 0.55)";
  const grid = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(26, 22, 19, 0.07)";

  const options: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit", foreColor: axis, background: "transparent" },
    colors: [color],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0, stops: [0, 95] } },
    grid: { borderColor: grid, strokeDashArray: 4, padding: { left: 8, right: 8 } },
    xaxis: {
      categories: current.map((b) => b.label),
      tickAmount: range === "30d" ? 6 : undefined,
      labels: { rotate: 0, hideOverlappingLabels: true, style: { fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        style: { fontSize: "11px" },
        formatter: (n: number) => (metric === "revenue" ? (n >= 1000 ? `${Math.round(n / 1000)}k` : `${Math.round(n)}`) : `${Math.round(n)}`),
      },
    },
    tooltip: { theme: isDark ? "dark" : "light", y: { formatter: (n: number) => formatValue(n) } },
    markers: { size: 0, hover: { size: 4 } },
  };

  const tab = (active: boolean) =>
    `cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition ${
      active
        ? "bg-white text-[#1A1613] shadow-xs dark:bg-[#2A2420] dark:text-[#F5EFE6]"
        : "text-[#1A1613]/60 hover:text-[#1A1613] dark:text-[#F5EFE6]/50 dark:hover:text-[#F5EFE6]"
    }`;

  return (
    <section className="h-full rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] p-5 dark:border-white/10 dark:bg-[#1E1A17]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#1A1613] dark:text-[#F5EFE6]">Sales</h2>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-40" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-[#1A1613] dark:text-[#F5EFE6]">
              {formatValue(value)}
              <span className="ml-2 text-sm font-medium text-[#1A1613]/50 dark:text-[#F5EFE6]/50">
                {metric === "revenue" ? "received" : "orders"} · last {rangeLabel}
              </span>
            </p>
          )}
          {!loading && (
            <p className="mt-0.5 text-xs text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
              {change === null
                ? `No ${metric === "revenue" ? "sales" : "orders"} in the ${rangeLabel} before`
                : (
                  <>
                    <span className={change >= 0 ? "font-semibold text-emerald-700 dark:text-emerald-400" : "font-semibold text-red-700 dark:text-red-400"}>
                      {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
                    </span>{" "}
                    vs the {rangeLabel} before ({formatValue(previous)})
                  </>
                )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg bg-[#1A1613]/5 p-0.5 dark:bg-white/5" role="tablist" aria-label="Chart metric">
            <button type="button" role="tab" aria-selected={metric === "revenue"} onClick={() => setMetric("revenue")} className={tab(metric === "revenue")}>
              Revenue
            </button>
            <button type="button" role="tab" aria-selected={metric === "orders"} onClick={() => setMetric("orders")} className={tab(metric === "orders")}>
              Orders
            </button>
          </div>
          <div className="flex rounded-lg bg-[#1A1613]/5 p-0.5 dark:bg-white/5" role="tablist" aria-label="Chart period">
            {RANGES.map((r) => (
              <button key={r.key} type="button" role="tab" aria-selected={range === r.key} onClick={() => setRange(r.key)} className={tab(range === r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 -mx-2">
        {loading ? (
          <Skeleton className="mx-2 h-[260px] w-auto rounded-xl" />
        ) : (
          <ReactApexChart
            key={`${metric}-${range}-${theme}`}
            options={options}
            series={[{ name: metric === "revenue" ? "Revenue" : "Orders", data: current.map((b) => (metric === "revenue" ? Math.round(b.revenue) : b.orders)) }]}
            type="area"
            height={260}
          />
        )}
      </div>
      <p className="mt-1 text-[11px] text-[#1A1613]/45 dark:text-[#F5EFE6]/40">
        Revenue counts paid orders that weren't cancelled. Cash on delivery counts once the order is delivered.
      </p>
    </section>
  );
};

export default SalesAnalyticsChart;
