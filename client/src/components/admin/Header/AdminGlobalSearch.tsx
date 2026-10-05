import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Package,
  ShoppingBag,
  Users,
  Layers,
  Star,
  Sliders,
  LayoutDashboard,
  Truck,
  User,
  ArrowRight,
  Clock,
  CornerDownLeft,
  AlertTriangle,
  AlertCircle,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchAdminProducts } from "../../../store/admin/productSlice";
import { fetchAdminCategories } from "../../../store/admin/categorySlice";
import { fetchAdminOrders } from "../../../store/admin/orderSlice";
import { fetchDatas } from "../../../store/admin/datasSlice";
import { useStoreSettings } from "../../../services/storeSettingsService";
import { APIAuthenticated } from "../../../http";

export type SearchCategory =
  | "all"
  | "orders"
  | "products"
  | "customers"
  | "categories"
  | "pages";

interface SearchResultItem {
  id: string;
  type: "action" | "order" | "product" | "customer" | "category" | "review" | "page";
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  meta?: string;
  image?: string;
  path: string;
  icon?: React.ReactNode;
}

const RECENT_SEARCHES_KEY = "truvora_admin_recent_searches";

export const AdminGlobalSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const storeSettings = useStoreSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [apiUsers, setApiUsers] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Redux state
  const { products } = useAppSelector((state) => state.adminProduct);
  const { categories } = useAppSelector((state) => state.adminCategory);
  const { orders } = useAppSelector((state) => state.adminOrder);
  const { recentUsers, recentOrders, orderDistribution } = useAppSelector(
    (state) => state.datas
  );

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 4));
      }
    } catch {
      // ignore
    }
  }, []);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Click outside listener: reliably closes the search dropdown when clicking anywhere outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus input on open & preload missing entities cleanly
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);

      // Preload data if not already present
      if (!products || products.length === 0) dispatch(fetchAdminProducts());
      if (!categories || categories.length === 0) dispatch(fetchAdminCategories());
      if (!orders || orders.length === 0) dispatch(fetchAdminOrders());
      if (!recentUsers || recentUsers.length === 0) dispatch(fetchDatas());

      // Fetch customer accounts from API
      APIAuthenticated.get("/admin/customer?limit=50")
        .then((res) => {
          if (res.status === 200 && res.data?.data) {
            setApiUsers(res.data.data);
          }
        })
        .catch(() => {
          // fallback to recentUsers from datas
        });
    } else {
      setQuery("");
      setSelectedIndex(0);
      setActiveCategory("all");
    }
  }, [isOpen, dispatch]);

  // Save to recent searches
  const recordRecentSearch = (text: string) => {
    if (!text.trim()) return;
    const clean = text.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 4);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== text);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Combine and normalize users from API & datasSlice
  const allUsers = useMemo(() => {
    const map = new Map<string, any>();
    (recentUsers || []).forEach((u: any) => {
      if (u?.id) map.set(u.id, u);
    });
    (apiUsers || []).forEach((u: any) => {
      if (u?.id) map.set(u.id, u);
    });
    return Array.from(map.values());
  }, [recentUsers, apiUsers]);

  // Combine orders from adminOrder and datasSlice
  const allOrders = useMemo(() => {
    const map = new Map<string, any>();
    (recentOrders || []).forEach((o: any) => {
      if (o?.id) map.set(o.id, o);
    });
    (orders || []).forEach((o: any) => {
      if (o?.id) map.set(o.id, o);
    });
    return Array.from(map.values());
  }, [recentOrders, orders]);

  // Operational real-time stats for Recommended Admin Searches
  const pendingOrdersCount = useMemo(() => {
    if (orderDistribution?.statusBreakdown?.pending !== undefined) {
      return orderDistribution.statusBreakdown.pending;
    }
    return allOrders.filter((o) => (o.orderStatus || "").toLowerCase() === "pending").length;
  }, [orderDistribution, allOrders]);

  const inTransitOrdersCount = useMemo(() => {
    if (orderDistribution?.statusBreakdown?.inTransit !== undefined) {
      return orderDistribution.statusBreakdown.inTransit;
    }
    return allOrders.filter((o) => (o.orderStatus || "").toLowerCase() === "intransit").length;
  }, [orderDistribution, allOrders]);

  const deliveredOrdersCount = useMemo(() => {
    if (orderDistribution?.statusBreakdown?.delivered !== undefined) {
      return orderDistribution.statusBreakdown.delivered;
    }
    return allOrders.filter((o) => (o.orderStatus || "").toLowerCase() === "delivered").length;
  }, [orderDistribution, allOrders]);

  const codOrdersCount = useMemo(() => {
    if (orderDistribution?.paymentBreakdown?.cod?.count !== undefined) {
      return orderDistribution.paymentBreakdown.cod.count;
    }
    return allOrders.filter(
      (o) => (o.Payment?.paymentMethod || "COD").toUpperCase() === "COD"
    ).length;
  }, [orderDistribution, allOrders]);

  const lowStockThreshold = storeSettings.lowStockThreshold || 5;
  const lowStockCount = useMemo(
    () =>
      (products || []).filter(
        (p) => (p.productStock || 0) <= lowStockThreshold && (p.productStock || 0) > 0
      ).length,
    [products, lowStockThreshold]
  );

  const outOfStockCount = useMemo(
    () => (products || []).filter((p) => (p.productStock || 0) === 0).length,
    [products]
  );

  const totalCustomersCount = useMemo(
    () => allUsers.filter((u) => u.role !== "admin").length || allUsers.length,
    [allUsers]
  );

  // Clean, focused Recommended Actions
  const recommendedActions = useMemo(
    () => [
      {
        id: "act-pending",
        title: "Pending Orders",
        subtitle: "Review orders awaiting admin confirmation or packing",
        badge: `${pendingOrdersCount} pending`,
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
        path: "/admin-dashboard/orders?status=Pending",
        icon: <Clock className="w-4 h-4 text-amber-600" />,
        keywords: ["pending", "pending orders", "new orders", "unprocessed", "approval"],
      },
      {
        id: "act-low-stock",
        title: "Low Stock Alert",
        subtitle: `Catalogue items with ≤ ${lowStockThreshold} units left`,
        badge: `${lowStockCount} items`,
        badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
        path: "/admin-dashboard/products?stock=LOW_STOCK",
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        keywords: ["low stock", "stock", "restock", "inventory alert", "running low"],
      },
      {
        id: "act-out-of-stock",
        title: "Out of Stock Items",
        subtitle: "Sold out products currently unavailable for checkout",
        badge: `${outOfStockCount} sold out`,
        badgeColor: "bg-red-50 text-red-700 border-red-200",
        path: "/admin-dashboard/products?stock=OUT_OF_STOCK",
        icon: <AlertCircle className="w-4 h-4 text-red-600" />,
        keywords: ["out of stock", "sold out", "0 stock", "unavailable", "empty"],
      },
      {
        id: "act-in-transit",
        title: "In-Transit Shipments",
        subtitle: "Parcels actively dispatched and en route with courier",
        badge: `${inTransitOrdersCount} active`,
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        path: "/admin-dashboard/orders?status=InTransit",
        icon: <Truck className="w-4 h-4 text-blue-600" />,
        keywords: ["in transit", "transit", "shipped", "shipping", "courier", "dispatched"],
      },
      {
        id: "act-cod",
        title: "Cash on Delivery Orders",
        subtitle: "Orders requiring cash collection on customer delivery",
        badge: `${codOrdersCount} orders`,
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
        path: "/admin-dashboard/orders?method=COD",
        icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
        keywords: ["cod", "cash on delivery", "cash", "cash payment"],
      },
      {
        id: "act-delivered",
        title: "Delivered Orders",
        subtitle: "Completed and fulfilled orders successfully delivered",
        badge: `${deliveredOrdersCount} delivered`,
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
        path: "/admin-dashboard/orders?status=Delivered",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        keywords: ["delivered", "completed", "fulfilled", "delivered orders"],
      },
      {
        id: "act-customers",
        title: "Registered Customers",
        subtitle: "Buyer accounts, verified profiles and order histories",
        badge: `${totalCustomersCount} users`,
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        path: "/admin-dashboard/users?role=customer",
        icon: <Users className="w-4 h-4 text-purple-600" />,
        keywords: ["customers", "users", "buyer", "shoppers", "profiles", "accounts"],
      },
      {
        id: "act-shipping",
        title: "Shipping & Delivery Settings",
        subtitle: `Rs. ${storeSettings.standardShippingFee} std fee • Free above Rs. ${storeSettings.freeShippingThreshold}`,
        badge: "Delivery Rules",
        badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
        path: "/admin-dashboard/settings?tab=orders",
        icon: <Truck className="w-4 h-4 text-sky-600" />,
        keywords: ["shipping", "delivery", "shipping fee", "delivery fee", "free shipping", "logistics"],
      },
      {
        id: "act-maintenance",
        title: "Storefront Status & Maintenance",
        subtitle: storeSettings.maintenanceMode
          ? "Maintenance mode is currently ACTIVE"
          : "Storefront is LIVE and operational",
        badge: storeSettings.maintenanceMode ? "Maintenance Active" : "Store Live",
        badgeColor: storeSettings.maintenanceMode
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200",
        path: "/admin-dashboard/settings?tab=maintenance",
        icon: <Sliders className="w-4 h-4 text-rose-600" />,
        keywords: ["maintenance", "maintenance mode", "store status", "pause store", "announcement"],
      },
    ],
    [
      pendingOrdersCount,
      lowStockThreshold,
      lowStockCount,
      outOfStockCount,
      inTransitOrdersCount,
      codOrdersCount,
      deliveredOrdersCount,
      totalCustomersCount,
      storeSettings,
    ]
  );

  // Quick navigation pages
  const adminPages: SearchResultItem[] = useMemo(
    () => [
      {
        id: "page-dashboard",
        type: "page",
        title: "Dashboard & Analytics",
        subtitle: "Overview, real-time sales & platform analytics",
        badge: "Overview",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        path: "/admin-dashboard",
        icon: <LayoutDashboard className="w-4 h-4 text-blue-600" />,
      },
      {
        id: "page-products",
        type: "page",
        title: "Product Management",
        subtitle: "Catalogue items, stock inventory, prices and SKU",
        badge: "Catalogue",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        path: "/admin-dashboard/products",
        icon: <Package className="w-4 h-4 text-emerald-600" />,
      },
      {
        id: "page-orders",
        type: "page",
        title: "Order Management",
        subtitle: "Customer shipments, invoices and order statuses",
        badge: "Sales",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        path: "/admin-dashboard/orders",
        icon: <ShoppingBag className="w-4 h-4 text-amber-600" />,
      },
      {
        id: "page-users",
        type: "page",
        title: "User Management",
        subtitle: "Verified buyers, customer accounts and roles",
        badge: "Accounts",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        path: "/admin-dashboard/users",
        icon: <Users className="w-4 h-4 text-purple-600" />,
      },
      {
        id: "page-categories",
        type: "page",
        title: "Category Management",
        subtitle: "Organize storefront departments and taxonomy",
        badge: "Taxonomy",
        badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
        path: "/admin-dashboard/categories",
        icon: <Layers className="w-4 h-4 text-teal-600" />,
      },
      {
        id: "page-reviews",
        type: "page",
        title: "Review Management",
        subtitle: "Moderate customer testimonials and star ratings",
        badge: "Feedback",
        badgeColor: "bg-yellow-50 text-yellow-800 border-yellow-200",
        path: "/admin-dashboard/reviews",
        icon: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />,
      },
      {
        id: "page-settings",
        type: "page",
        title: "Store Settings",
        subtitle: "General profile, delivery rules & maintenance",
        badge: "Settings",
        badgeColor: "bg-orange-50 text-[#E6540B] border-orange-200",
        path: "/admin-dashboard/settings",
        icon: <Sliders className="w-4 h-4 text-[#E6540B]" />,
      },
      {
        id: "page-profile",
        type: "page",
        title: "Admin Profile",
        subtitle: "Account details, avatar image and password",
        badge: "Security",
        badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
        path: "/admin-dashboard/profile",
        icon: <User className="w-4 h-4 text-gray-600" />,
      },
    ],
    []
  );

  // Compute search results when typing
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const orderPrefix = storeSettings.orderPrefix || "TRV-";
    const items: SearchResultItem[] = [];

    // 1. MATCHING RECOMMENDED ACTIONS (Top Priority)
    recommendedActions.forEach((act) => {
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchSubtitle = act.subtitle.toLowerCase().includes(q);
      const matchKeywords = act.keywords.some((kw) => kw.includes(q) || q.includes(kw));

      if (matchTitle || matchSubtitle || matchKeywords) {
        items.push({
          id: act.id,
          type: "action",
          title: act.title,
          subtitle: act.subtitle,
          badge: act.badge,
          badgeColor: act.badgeColor,
          path: act.path,
          icon: act.icon,
        });
      }
    });

    // 2. ORDERS
    allOrders.forEach((o) => {
      const id = String(o.id || "");
      const displayId = id.startsWith(orderPrefix) ? id : `${orderPrefix}${id.slice(0, 8)}`;
      const customer = o.User?.username || o.customerName || (o as any).name || "Customer";
      const email = o.User?.email || "";
      const phone = o.phoneNumber || "";
      const status = o.orderStatus || "";
      const method = o.Payment?.paymentMethod || "";
      const address = o.shippingAddress || "";

      if (
        id.toLowerCase().includes(q) ||
        displayId.toLowerCase().includes(q) ||
        customer.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        phone.includes(q) ||
        status.toLowerCase().includes(q) ||
        method.toLowerCase().includes(q) ||
        address.toLowerCase().includes(q)
      ) {
        let statusBadgeColor = "bg-gray-100 text-gray-700 border-gray-200";
        if (status === "Delivered")
          statusBadgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
        else if (status === "Cancelled")
          statusBadgeColor = "bg-red-50 text-red-700 border-red-200";
        else if (status === "Pending")
          statusBadgeColor = "bg-amber-50 text-amber-800 border-amber-200";
        else if (status === "InTransit")
          statusBadgeColor = "bg-blue-50 text-blue-700 border-blue-200";

        items.push({
          id: `order-${o.id}`,
          type: "order",
          title: `Order ${displayId}`,
          subtitle: `${customer} • ${method || "COD"}`,
          badge: status,
          badgeColor: statusBadgeColor,
          meta: o.totalAmount ? `Rs. ${Number(o.totalAmount).toLocaleString()}` : "",
          path: `/admin-dashboard/orders?search=${encodeURIComponent(o.id)}`,
          icon: <ShoppingBag className="w-4 h-4 text-[#E6540B]" />,
        });
      }
    });

    // 3. PRODUCTS
    (products || []).forEach((p) => {
      const name = p.productName || "";
      const desc = p.productDescription || "";
      const cat = p.category?.categoryName || p.Category?.categoryName || (p as any).categoryName || "";
      const id = p.id || "";
      const price = p.productPrice !== undefined ? String(p.productPrice) : "";

      if (
        name.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q) ||
        (q === "low stock" && (p.productStock || 0) <= lowStockThreshold && (p.productStock || 0) > 0) ||
        (q === "out of stock" && (p.productStock || 0) === 0)
      ) {
        const stock = p.productStock || 0;
        let stockBadge = "In Stock";
        let stockBadgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";

        if (stock === 0) {
          stockBadge = "Out of Stock";
          stockBadgeColor = "bg-red-50 text-red-700 border-red-200";
        } else if (stock <= lowStockThreshold) {
          stockBadge = `Low: ${stock} left`;
          stockBadgeColor = "bg-amber-50 text-amber-800 border-amber-200";
        }

        items.push({
          id: `product-${p.id}`,
          type: "product",
          title: name,
          subtitle: cat ? `Category: ${cat}` : desc.slice(0, 50),
          badge: stockBadge,
          badgeColor: stockBadgeColor,
          meta: `Rs. ${Number(price).toLocaleString()}`,
          image: p.productImage,
          path: `/admin-dashboard/products?search=${encodeURIComponent(name)}`,
          icon: <Package className="w-4 h-4 text-emerald-600" />,
        });
      }
    });

    // 4. CUSTOMERS / USERS
    allUsers.forEach((u) => {
      const username = u.username || "";
      const email = u.email || "";
      const role = u.role || "customer";

      if (
        username.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q)
      ) {
        items.push({
          id: `user-${u.id}`,
          type: "customer",
          title: username,
          subtitle: email,
          badge: role === "admin" ? "Admin" : "Customer",
          badgeColor:
            role === "admin"
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : "bg-blue-50 text-blue-700 border-blue-200",
          image: u.avatar,
          path: `/admin-dashboard/users?search=${encodeURIComponent(email || username)}`,
          icon: <Users className="w-4 h-4 text-purple-600" />,
        });
      }
    });

    // 5. CATEGORIES
    (categories || []).forEach((c) => {
      const name = c.categoryName || "";
      const desc = c.categoryDescription || "";

      if (name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
        items.push({
          id: `cat-${c.id}`,
          type: "category",
          title: name,
          subtitle: desc ? desc.slice(0, 60) : "Category Department",
          badge: "Category",
          badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
          path: `/admin-dashboard/categories?search=${encodeURIComponent(name)}`,
          icon: <Layers className="w-4 h-4 text-teal-600" />,
        });
      }
    });

    // 6. PAGES
    adminPages.forEach((p) => {
      if (
        p.title.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q))
      ) {
        items.push(p);
      }
    });

    return items;
  }, [
    query,
    products,
    categories,
    allOrders,
    allUsers,
    adminPages,
    recommendedActions,
    storeSettings,
    lowStockThreshold,
  ]);

  // Filtered by selected Category Tab
  const filteredResults = useMemo(() => {
    if (activeCategory === "all") return searchResults;
    const typeMap: Record<SearchCategory, string[]> = {
      all: [],
      orders: ["order"],
      products: ["product"],
      customers: ["customer"],
      categories: ["category"],
      pages: ["page", "action"],
    };
    return searchResults.filter((r) => typeMap[activeCategory].includes(r.type));
  }, [searchResults, activeCategory]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<SearchCategory, number> = {
      all: searchResults.length,
      orders: 0,
      products: 0,
      customers: 0,
      categories: 0,
      pages: 0,
    };
    searchResults.forEach((r) => {
      if (r.type === "order") counts.orders++;
      if (r.type === "product") counts.products++;
      if (r.type === "customer") counts.customers++;
      if (r.type === "category") counts.categories++;
      if (r.type === "page" || r.type === "action") counts.pages++;
    });
    return counts;
  }, [searchResults]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Scroll active item into view
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const activeEl = resultsContainerRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Navigate to selected result
  const handleSelectResult = (item: SearchResultItem | { title: string; path: string }) => {
    recordRecentSearch(item.title);
    setIsOpen(false);
    navigate(item.path);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      } else if (query.trim()) {
        recordRecentSearch(query);
        setIsOpen(false);
        navigate(`/admin-dashboard/products?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <div className="relative">
      {/* 1. DESKTOP & TABLET SEARCH TRIGGER BAR */}
      <div className="hidden md:block">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center h-10 w-64 md:w-80 lg:w-[360px] xl:w-[420px] pl-10 pr-3.5 rounded-xl border border-[#1A1613]/15 bg-[#F4EEDF]/50 hover:bg-[#F4EEDF]/80 hover:border-[#1A1613]/25 text-sm text-[#1A1613] transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E6540B]/20"
          aria-label="Open search command palette"
        >
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1613]/40 group-hover:text-[#E6540B] transition-colors"
            size={16}
          />
          <span className="truncate text-xs sm:text-sm text-[#1A1613]/55 group-hover:text-[#1A1613]">
            Search products, orders, customers...
          </span>
          <kbd className="ml-auto hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-[#1A1613]/60 bg-[#FFFDF8] border border-[#1A1613]/15 rounded shadow-2xs font-mono">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* 2. MOBILE SEARCH TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2.5 rounded-lg text-[#1A1613]/70 hover:bg-[#F4EEDF] hover:text-[#1A1613] transition-colors md:hidden focus:outline-none"
        aria-label="Search"
      >
        <Search size={20} />
      </button>

      {/* 3. SEARCH MODAL / PALETTE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 z-99999 flex flex-col items-center justify-start p-3 sm:p-6 md:pt-16 bg-[#1A1613]/45 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-2xl bg-[#FFFDF8] rounded-2xl border border-[#1A1613]/15 shadow-2xl shadow-[#1A1613]/20 flex flex-col overflow-hidden text-[#1A1613]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Input Header */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#1A1613]/10 gap-3 bg-[#FFFDF8]">
              <Search className="w-5 h-5 text-[#1A1613]/40 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, orders, customers, settings..."
                className="w-full bg-transparent text-sm sm:text-base text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 text-[#1A1613]/40 hover:text-[#E6540B] rounded-md cursor-pointer transition-colors"
                  aria-label="Clear query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2 py-0.5 text-xs font-medium text-[#1A1613]/60 hover:text-[#1A1613] bg-[#F4EEDF] hover:bg-[#EDE5D0] border border-[#1A1613]/10 rounded-md transition-colors shrink-0 cursor-pointer"
              >
                Esc
              </button>
            </div>

            {/* Category Filter Pills (When query is active) */}
            {query.trim() && searchResults.length > 0 && (
              <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#1A1613]/10 overflow-x-auto bg-[#FBF9F4] no-scrollbar">
                {[
                  { key: "all", label: "All", count: categoryCounts.all },
                  { key: "orders", label: "Orders", count: categoryCounts.orders },
                  { key: "products", label: "Products", count: categoryCounts.products },
                  { key: "customers", label: "Customers", count: categoryCounts.customers },
                  { key: "categories", label: "Categories", count: categoryCounts.categories },
                  { key: "pages", label: "Pages", count: categoryCounts.pages },
                ]
                  .filter((tab) => tab.key === "all" || tab.count > 0)
                  .map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveCategory(tab.key as SearchCategory)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                        activeCategory === tab.key
                          ? "bg-[#E6540B] text-white shadow-2xs font-semibold"
                          : "text-[#1A1613]/70 hover:text-[#1A1613] hover:bg-[#F4EEDF]"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          activeCategory === tab.key
                            ? "bg-white/20 text-white"
                            : "bg-[#1A1613]/8 text-[#1A1613]/70"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
              </div>
            )}

            {/* Results Body */}
            <div
              ref={resultsContainerRef}
              className="flex-1 overflow-y-auto p-2 sm:p-3 max-h-[60vh] space-y-4"
            >
              {/* STATE 1: Empty Query - Clean, Uncluttered Human-Designed State */}
              {!query.trim() && (
                <div className="space-y-4 py-1">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-[#1A1613]/45 uppercase tracking-wider">
                        <span>Recent Searches</span>
                        <button
                          type="button"
                          onClick={() => {
                            setRecentSearches([]);
                            localStorage.removeItem(RECENT_SEARCHES_KEY);
                          }}
                          className="hover:text-red-600 transition-colors cursor-pointer text-[10px] lowercase"
                        >
                          clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-2">
                        {recentSearches.map((term) => (
                          <span
                            key={term}
                            onClick={() => setQuery(term)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#F4EEDF] hover:bg-[#EDE5D0] text-[#1A1613] border border-[#1A1613]/10 transition-colors cursor-pointer"
                          >
                            <span>{term}</span>
                            <X
                              className="w-3 h-3 text-[#1A1613]/40 hover:text-red-500"
                              onClick={(e) => removeRecentSearch(e, term)}
                            />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Quick Actions (Clean Linear / Raycast Style Command List) */}
                  <div className="space-y-1">
                    <div className="px-2 text-[11px] font-semibold text-[#1A1613]/45 uppercase tracking-wider">
                      Recommended Actions
                    </div>

                    <div className="space-y-0.5">
                      {recommendedActions.slice(0, 6).map((action) => (
                        <div
                          key={action.id}
                          onClick={() => handleSelectResult(action)}
                          className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#F4EEDF]/60 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-[#F4EEDF] border border-[#1A1613]/10 flex items-center justify-center shrink-0 group-hover:bg-[#E6540B]/10 group-hover:border-[#E6540B]/20 transition-colors">
                              {action.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-[#1A1613] group-hover:text-[#E6540B] transition-colors truncate">
                                {action.title}
                              </p>
                              <p className="text-[11px] text-[#1A1613]/55 truncate">
                                {action.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {action.badge && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${action.badgeColor}`}
                              >
                                {action.badge}
                              </span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 text-[#1A1613]/25 group-hover:text-[#E6540B] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Admin Navigation */}
                  <div className="space-y-1 pt-1 border-t border-[#1A1613]/10">
                    <div className="px-2 pt-2 text-[11px] font-semibold text-[#1A1613]/45 uppercase tracking-wider">
                      Quick Links
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 px-1 pt-0.5">
                      {adminPages.slice(0, 4).map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => handleSelectResult(page)}
                          className="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-[#F4EEDF]/70 border border-transparent hover:border-[#1A1613]/10 transition-all cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#F4EEDF] flex items-center justify-center shrink-0">
                            {page.icon}
                          </div>
                          <span className="text-xs font-medium text-[#1A1613] truncate group-hover:text-[#E6540B]">
                            {page.title.split(" ")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 2: Active Query with Matches */}
              {query.trim() && filteredResults.length > 0 && (
                <div className="space-y-1">
                  {filteredResults.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        data-index={idx}
                        onClick={() => handleSelectResult(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#E6540B]/10 border border-[#E6540B]/25"
                            : "hover:bg-[#F4EEDF]/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0 border border-[#1A1613]/10"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#F4EEDF] border border-[#1A1613]/10 flex items-center justify-center shrink-0">
                              {item.icon || <Search className="w-4 h-4 text-[#1A1613]/40" />}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm font-semibold text-[#1A1613] truncate">
                                {item.title}
                              </p>
                              {item.badge && (
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                                    item.badgeColor || "bg-[#F4EEDF] text-[#1A1613] border-[#1A1613]/15"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className="text-[11px] text-[#1A1613]/55 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {item.meta && (
                            <span className="text-xs font-semibold text-[#1A1613] font-mono">
                              {item.meta}
                            </span>
                          )}
                          {isSelected && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[#E6540B] font-semibold">
                              <span>Open</span>
                              <CornerDownLeft className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STATE 3: Active Query with No Matches */}
              {query.trim() && filteredResults.length === 0 && (
                <div className="py-10 text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#F4EEDF] text-[#1A1613]/40 mx-auto flex items-center justify-center border border-[#1A1613]/10">
                    <Search className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#1A1613]">
                    No matches found for "{query}"
                  </h4>
                  <p className="text-xs text-[#1A1613]/55 max-w-sm mx-auto">
                    Try searching by order ID, product name, or customer email.
                  </p>

                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/admin-dashboard/products?search=${encodeURIComponent(query.trim())}`);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#E6540B] text-white hover:bg-[#d44c0a] cursor-pointer shadow-2xs"
                    >
                      Search Catalogue
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setActiveCategory("all");
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#1A1613]/15 bg-[#FFFDF8] hover:bg-[#F4EEDF] text-[#1A1613] cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-4 py-2.5 bg-[#FBF9F4] border-t border-[#1A1613]/10 text-[11px] text-[#1A1613]/55 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 text-[10px] bg-[#FFFDF8] border border-[#1A1613]/15 rounded font-mono text-[#1A1613] shadow-2xs">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 text-[10px] bg-[#FFFDF8] border border-[#1A1613]/15 rounded font-mono text-[#1A1613] shadow-2xs">
                    ↓
                  </kbd>
                  <span className="ml-0.5">navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 text-[10px] bg-[#FFFDF8] border border-[#1A1613]/15 rounded font-mono text-[#1A1613] shadow-2xs">
                    ↵
                  </kbd>
                  <span className="ml-0.5">select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 text-[10px] bg-[#FFFDF8] border border-[#1A1613]/15 rounded font-mono text-[#1A1613] shadow-2xs">
                    esc
                  </kbd>
                  <span className="ml-0.5">close</span>
                </span>
              </div>

              <span className="text-[10px] text-[#1A1613]/45">
                {filteredResults.length} {filteredResults.length === 1 ? "result" : "results"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGlobalSearch;
