import React, { useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { TrendingUp } from "lucide-react";
import { OrderData, SalesRecord } from "../../../types/admin/datasTypes";
import { Skeleton } from "../../../global/Skeleton";
import { useTheme } from "../../../context/ThemeContext";

interface SalesAnalyticsChartProps {
  recentOrders: OrderData[];
  totalRevenue: number;
  totalOrders: number;
  salesAnalytics?: SalesRecord[];
  loading?: boolean;
}

const SalesAnalyticsChart: React.FC<SalesAnalyticsChartProps> = ({
  recentOrders,
  totalRevenue,
  totalOrders,
  salesAnalytics = [],
  loading = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  // Aggregate orders by real calendar dates
  const chartData = useMemo(() => {
    const ordersList =
      salesAnalytics && salesAnalytics.length > 0
        ? salesAnalytics
        : recentOrders;

    if (timeRange === "7d") {
      const now = new Date();
      const points: { label: string; dateKey: string; revenue: number; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        points.push({ label, dateKey, revenue: 0, count: 0 });
      }

      ordersList.forEach((order) => {
        const orderDate = new Date(order.createdAt).toISOString().slice(0, 10);
        const matched = points.find((p) => p.dateKey === orderDate);
        if (matched) {
          matched.revenue += Number(order.totalAmount) || 0;
          matched.count += 1;
        }
      });

      return {
        categories: points.map((p) => p.label),
        revenueSeries: points.map((p) => p.revenue),
        ordersSeries: points.map((p) => p.count),
      };
    }

    if (timeRange === "30d") {
      const now = new Date();
      const points: { label: string; dateKey: string; revenue: number; count: number }[] = [];
      // Step by 3-4 days to show clean, legible chart points over 30 days
      for (let i = 28; i >= 0; i -= 4) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        points.push({ label, dateKey, revenue: 0, count: 0 });
      }

      ordersList.forEach((order) => {
        const orderTime = new Date(order.createdAt).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (orderTime >= thirtyDaysAgo) {
          const orderDate = new Date(order.createdAt).toISOString().slice(0, 10);
          // Find closest point or exact match
          const exact = points.find((p) => p.dateKey === orderDate);
          if (exact) {
            exact.revenue += Number(order.totalAmount) || 0;
            exact.count += 1;
          } else {
            // Attribute to the latest bucket point
            points[points.length - 1].revenue += Number(order.totalAmount) || 0;
            points[points.length - 1].count += 1;
          }
        }
      });

      return {
        categories: points.map((p) => p.label),
        revenueSeries: points.map((p) => p.revenue),
        ordersSeries: points.map((p) => p.count),
      };
    }

    // "all" time: group chronologically by month or distinct dates
    const dateMap = new Map<string, { revenue: number; count: number }>();
    const sorted = [...ordersList].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sorted.forEach((order) => {
      const d = new Date(order.createdAt);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const curr = dateMap.get(key) || { revenue: 0, count: 0 };
      curr.revenue += Number(order.totalAmount) || 0;
      curr.count += 1;
      dateMap.set(key, curr);
    });

    if (dateMap.size === 0) {
      const currentMonth = new Date().toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      dateMap.set(currentMonth, { revenue: totalRevenue, count: totalOrders });
    }

    return {
      categories: Array.from(dateMap.keys()),
      revenueSeries: Array.from(dateMap.values()).map((v) => v.revenue),
      ordersSeries: Array.from(dateMap.values()).map((v) => v.count),
    };
  }, [salesAnalytics, recentOrders, timeRange, totalRevenue, totalOrders]);

  const activeSeries =
    metric === "revenue"
      ? [
          {
            name: "Revenue (Rs)",
            data: chartData.revenueSeries,
          },
        ]
      : [
          {
            name: "Orders Count",
            data: chartData.ordersSeries,
          },
        ];

  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const pool = salesAnalytics.length > 0 ? salesAnalytics : recentOrders;
  const highestOrder =
    pool.length > 0
      ? Math.max(...pool.map((o) => Number(o.totalAmount) || 0))
      : totalRevenue || 0;

  // Theme-dependent chart colours (options are rebuilt on every render, so a theme toggle re-styles the chart)
  const axisLabelColor = isDark ? "rgba(245, 239, 230, 0.6)" : "rgba(26, 22, 19, 0.6)";
  const gridLineColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(26, 22, 19, 0.08)";
  // The light-mode green is too dark to read on the dark card, so it is lifted slightly in dark mode
  const ordersColor = isDark ? "#4FA37C" : "#2F6B4F";
  const seriesColor = metric === "revenue" ? "#E6540B" : ordersColor;

  const chartOptions: ApexOptions = {
    chart: {
      foreColor: axisLabelColor,
      background: "transparent",
      type: "area",
      height: 310,
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
      zoom: {
        enabled: false,
      },
    },
    colors: [seriesColor],
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100],
      },
    },
    stroke: {
      curve: "smooth",
      width: 2.5,
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      strokeDashArray: 4,
      borderColor: gridLineColor,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          colors: axisLabelColor,
          fontSize: "12px",
          fontWeight: 500,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: axisLabelColor,
          fontSize: "12px",
        },
        formatter: (val: number) => {
          return metric === "revenue" ? `Rs ${Math.round(val)}` : `${Math.round(val)}`;
        },
      },
    },
    tooltip: {
      theme: theme,
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) =>
          metric === "revenue" ? `Rs ${val.toLocaleString()}` : `${val} orders`,
      },
      style: {
        fontSize: "12px",
      },
    },
    markers: {
      size: 4,
      colors: [isDark ? "#1E1A17" : "#FFFDF8"],
      strokeColors: seriesColor,
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
  };

  return (
    <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] p-5 shadow-[0_2px_14px_-6px_rgba(26,22,19,0.06)] md:p-6 dark:border-white/10 dark:bg-[#1E1A17]">
      {/* Header with Title and Interactive Toggles */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#1A1613]/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#1A1613] dark:text-[#F5EFE6]">
              Sales & Growth Trends
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              +14.8%
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#1A1613]/60 dark:text-[#F5EFE6]/50">
            Real-time tracking of platform transactions and volume
          </p>
        </div>

        {/* View and Time Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="inline-flex rounded-lg bg-[#F4EEDF] p-1 dark:bg-[#2A2420]">
            <button
              onClick={() => setMetric("revenue")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                metric === "revenue"
                  ? "bg-[#E6540B] text-white shadow-xs"
                  : "text-[#1A1613]/70 hover:text-[#1A1613] dark:text-[#F5EFE6]/70 dark:hover:text-[#F5EFE6]"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setMetric("orders")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                metric === "orders"
                  ? "bg-[#E6540B] text-white shadow-xs"
                  : "text-[#1A1613]/70 hover:text-[#1A1613] dark:text-[#F5EFE6]/70 dark:hover:text-[#F5EFE6]"
              }`}
            >
              Orders
            </button>
          </div>

          {/* Time Filter */}
          <div className="inline-flex rounded-lg border border-[#1A1613]/10 bg-[#FFFDF8] p-1 text-xs dark:border-white/10 dark:bg-[#1E1A17]">
            <button
              onClick={() => setTimeRange("7d")}
              className={`px-2.5 py-1 rounded transition-colors ${
                timeRange === "7d"
                  ? "bg-[#1A1613]/10 font-bold text-[#1A1613] dark:bg-white/10 dark:text-[#F5EFE6]"
                  : "text-[#1A1613]/60 hover:text-[#1A1613] dark:text-[#F5EFE6]/50 dark:hover:text-[#F5EFE6]"
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-2.5 py-1 rounded transition-colors ${
                timeRange === "30d"
                  ? "bg-[#1A1613]/10 font-bold text-[#1A1613] dark:bg-white/10 dark:text-[#F5EFE6]"
                  : "text-[#1A1613]/60 hover:text-[#1A1613] dark:text-[#F5EFE6]/50 dark:hover:text-[#F5EFE6]"
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeRange("all")}
              className={`px-2.5 py-1 rounded transition-colors ${
                timeRange === "all"
                  ? "bg-[#1A1613]/10 font-bold text-[#1A1613] dark:bg-white/10 dark:text-[#F5EFE6]"
                  : "text-[#1A1613]/60 hover:text-[#1A1613] dark:text-[#F5EFE6]/50 dark:hover:text-[#F5EFE6]"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* ApexChart Container */}
      {loading ? (
        <div className="mt-4 flex h-75 gap-3">
          <div className="flex flex-col justify-between py-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-2.5 w-10" />
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="flex-1 rounded-lg" />
            <div className="flex justify-between">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-2.5 w-10" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 -ml-3">
          <ReactApexChart
            options={chartOptions}
            series={activeSeries}
            type="area"
            height={300}
          />
        </div>
      )}

      {/* Mini KPI Footer */}
      <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-[#1A1613]/10 sm:grid-cols-4 dark:border-white/10">
        <div className="rounded-lg bg-[#FDF8ED] p-3 dark:bg-[#2A2420]">
          <p className="text-[11px] font-semibold uppercase text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
            Total Sales
          </p>
          {loading ? (
            <Skeleton className="mt-1.5 mb-1 h-4 w-20" />
          ) : (
            <p className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6] mt-0.5">
              Rs {totalRevenue.toLocaleString()}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-[#FDF8ED] p-3 dark:bg-[#2A2420]">
          <p className="text-[11px] font-semibold uppercase text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
            Avg Order Value
          </p>
          {loading ? (
            <Skeleton className="mt-1.5 mb-1 h-4 w-20" />
          ) : (
            <p className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6] mt-0.5">
              Rs {avgOrderValue.toLocaleString()}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-[#FDF8ED] p-3 dark:bg-[#2A2420]">
          <p className="text-[11px] font-semibold uppercase text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
            Max Single Order
          </p>
          {loading ? (
            <Skeleton className="mt-1.5 mb-1 h-4 w-20" />
          ) : (
            <p className="text-base font-bold text-[#1A1613] dark:text-[#F5EFE6] mt-0.5">
              Rs {highestOrder.toLocaleString()}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-[#FDF8ED] p-3 dark:bg-[#2A2420]">
          <p className="text-[11px] font-semibold uppercase text-[#1A1613]/55 dark:text-[#F5EFE6]/50">
            Active Orders
          </p>
          {loading ? (
            <Skeleton className="mt-1.5 mb-1 h-4 w-20" />
          ) : (
            <p className="text-base font-bold text-[#E6540B] mt-0.5">
              {recentOrders.filter((o) => o.orderStatus !== "Delivered").length} pending
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalyticsChart;
