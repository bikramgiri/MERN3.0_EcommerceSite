import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  X,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  fetchAdminProducts,
  addAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  updateAdminProductStock,
} from "../../store/admin/productSlice";
import { fetchAdminCategories } from "../../store/admin/categorySlice";
import { fetchProducts as syncCustomerProducts } from "../../store/customer/productSlice";
import { fetchDatas as syncDashboardStats } from "../../store/admin/datasSlice";
import { AdminProduct } from "../../types/admin/productTypes";
import { Status } from "../../global/statuses";
import ProductTable from "../../components/admin/Products/ProductTable";
import ProductGrid from "../../components/admin/Products/ProductGrid";
import ProductModal from "../../components/admin/Products/ProductModal";
import ProductViewModal from "../../components/admin/Products/ProductViewModal";
import ProductDeleteModal from "../../components/admin/Products/ProductDeleteModal";
import ProductStockModal from "../../components/admin/Products/ProductStockModal";
import { connectSocket } from "../../services/socket";
import { useStoreSettings } from "../../services/storeSettingsService";

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ProductManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, status, actionLoading } = useAppSelector(
    (state) => state.adminProduct
  );
  const { categories } = useAppSelector((state) => state.adminCategory);
  const { lowStockThreshold = 5 } = useStoreSettings();

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<
    | "newest"
    | "oldest"
    | "price_asc"
    | "price_desc"
    | "stock_asc"
    | "stock_desc"
    | "name_asc"
    | "name_desc"
  >("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null
  );
  const [viewingProduct, setViewingProduct] = useState<AdminProduct | null>(
    null
  );
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(
    null
  );
  const [stockProduct, setStockProduct] = useState<AdminProduct | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initial load & real-time socket updates
  useEffect(() => {
    dispatch(fetchAdminProducts());
    dispatch(fetchAdminCategories());

    const socket = connectSocket();
    const handleProductRefresh = () => {
      dispatch(fetchAdminProducts());
    };

    socket.on("admin:low-stock", handleProductRefresh);
    socket.on("admin:out-of-stock", handleProductRefresh);
    socket.on("admin:order-created", handleProductRefresh);
    socket.on("admin:dashboard-refresh", handleProductRefresh);

    return () => {
      socket.off("admin:low-stock", handleProductRefresh);
      socket.off("admin:out-of-stock", handleProductRefresh);
      socket.off("admin:order-created", handleProductRefresh);
      socket.off("admin:dashboard-refresh", handleProductRefresh);
    };
  }, [dispatch]);

  // Sync selected category and search from URL query param (?category=, ?categoryId=, ?search=) or location.state
  useEffect(() => {
    const catParam =
      searchParams.get("category") ||
      searchParams.get("categoryId") ||
      (location.state as any)?.categoryId ||
      (location.state as any)?.category;

    if (catParam) {
      const matched = categories.find(
        (c) =>
          c.id === catParam ||
          c.categoryName?.toLowerCase() === catParam.toLowerCase()
      );
      const targetId = matched ? matched.id : catParam;
      setSelectedCategory(targetId);
      setCurrentPage(1);
    }

    const searchQ = searchParams.get("search");
    if (searchQ) {
      const lower = searchQ.trim().toLowerCase();
      if (lower === "low stock" || lower === "lowstock") {
        setStockFilter("LOW_STOCK");
        setSearchTerm("");
      } else if (lower === "out of stock" || lower === "outofstock" || lower === "sold out") {
        setStockFilter("OUT_OF_STOCK");
        setSearchTerm("");
      } else {
        setSearchTerm(searchQ);
      }
      setCurrentPage(1);
    }

    const stockParam = searchParams.get("stock") || searchParams.get("stockFilter");
    if (stockParam) {
      const upper = stockParam.toUpperCase();
      if (["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "ALERT", "ALL"].includes(upper)) {
        setStockFilter(upper);
      } else if (upper.includes("LOW")) {
        setStockFilter("LOW_STOCK");
      } else if (upper.includes("OUT")) {
        setStockFilter("OUT_OF_STOCK");
      }
      setCurrentPage(1);
    }
  }, [searchParams, location.state, categories]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (catId === "ALL") {
          next.delete("category");
          next.delete("categoryId");
        } else {
          next.set("category", catId);
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleRefresh = async () => {
    await dispatch(fetchAdminProducts());
    await dispatch(fetchAdminCategories());
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleStockUpdate = async (
    productId: string,
    newStock: number
  ): Promise<boolean> => {
    const result = await dispatch(updateAdminProductStock(productId, newStock));
    if (result && result.success) {
      dispatch(syncCustomerProducts());
      dispatch(syncDashboardStats());
      setStockProduct(null);
      return true;
    }
    return false;
  };

  const handleModalSubmit = async (formData: FormData): Promise<boolean> => {
    let result;
    if (editingProduct) {
      result = await dispatch(updateAdminProduct(editingProduct.id, formData));
    } else {
      result = await dispatch(addAdminProduct(formData));
    }

    if (result && result.success) {
      // Sync customer catalogue and dashboard metrics
      dispatch(syncCustomerProducts());
      dispatch(syncDashboardStats());
      return true;
    }
    return false;
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    const result = await dispatch(deleteAdminProduct(deletingProduct.id));
    if (result && result.success) {
      dispatch(syncCustomerProducts());
      dispatch(syncDashboardStats());
      setDeletingProduct(null);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset & active filter state
  const isFiltered =
    searchTerm.trim() !== "" ||
    selectedCategory !== "ALL" ||
    stockFilter !== "ALL" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setStockFilter("ALL");
    setSortBy("newest");
    setCurrentPage(1);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("category");
        next.delete("categoryId");
        return next;
      },
      { replace: true }
    );
  };

  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === "ALL") return null;
    return categories.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = product.productName?.toLowerCase().includes(q);
          const matchDesc = product.productDescription
            ?.toLowerCase()
            .includes(q);
          const matchId = product.id?.toLowerCase().includes(q);
          const matchCategory = (
            product.category?.categoryName ||
            product.Category?.categoryName ||
            ""
          )
            .toLowerCase()
            .includes(q);
          if (!matchName && !matchDesc && !matchId && !matchCategory) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== "ALL") {
          const prodCatId =
            product.categoryId ||
            product.Category?.id ||
            product.category?.id;
          if (prodCatId !== selectedCategory) {
            return false;
          }
        }

        // Stock filter
        if (stockFilter === "IN_STOCK") {
          if ((product.productStock || 0) < lowStockThreshold) return false;
        } else if (stockFilter === "LOW_STOCK") {
          const stock = product.productStock || 0;
          if (stock <= 0 || stock >= lowStockThreshold) return false;
        } else if (stockFilter === "OUT_OF_STOCK") {
          if ((product.productStock || 0) > 0) return false;
        } else if (stockFilter === "ALERT") {
          // Low stock (<threshold) and Out of stock (0)
          const stock = product.productStock || 0;
          if (stock >= lowStockThreshold) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }
        if (sortBy === "oldest") {
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        }
        if (sortBy === "price_asc") {
          return (a.productPrice || 0) - (b.productPrice || 0);
        }
        if (sortBy === "price_desc") {
          return (b.productPrice || 0) - (a.productPrice || 0);
        }
        if (sortBy === "stock_asc") {
          return (a.productStock || 0) - (b.productStock || 0);
        }
        if (sortBy === "stock_desc") {
          return (b.productStock || 0) - (a.productStock || 0);
        }
        if (sortBy === "name_asc") {
          return (a.productName || "").localeCompare(b.productName || "");
        }
        if (sortBy === "name_desc") {
          return (b.productName || "").localeCompare(a.productName || "");
        }
        return 0;
      });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy, lowStockThreshold]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const loading = status === Status.LOADING;

  // KPI Calculations
  const totalProductsCount = products.length;
  const inStockCount = products.filter(
    (p) => (p.productStock || 0) >= lowStockThreshold
  ).length;
  const lowStockCount = products.filter(
    (p) => (p.productStock || 0) > 0 && (p.productStock || 0) < lowStockThreshold
  ).length;
  const outOfStockCount = products.filter(
    (p) => (p.productStock || 0) === 0
  ).length;
  const totalCatalogValue = products.reduce(
    (sum, p) => sum + (p.productPrice || 0) * (p.productStock || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1613] sm:text-3xl">
              Product Management
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#1A1613]/60 sm:text-sm">
            Manage your catalog, stock levels, pricing, and product categories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1A1613]/15 bg-[#FFFDF8] px-4 py-2 text-xs font-semibold text-[#1A1613] shadow-xs hover:bg-[#F4EEDF] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loading ? "animate-spin text-[#E6540B]" : ""
              }`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E6540B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#d44c0a] transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Products */}
        <div
          onClick={() => {
            setStockFilter("ALL");
            handleCategoryChange("ALL");
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            stockFilter === "ALL" && selectedCategory === "ALL" && !searchTerm
              ? "border-[#E6540B]/40 bg-[#FFFDF8] shadow-xs"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-[#E6540B]/40"
          }`}
          title="Click to reset filters and view all products"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Total Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A1613]">
              {loading ? "..." : totalProductsCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">in catalog</span>
          </div>
        </div>

        {/* Healthy In-Stock */}
        <div
          onClick={() => {
            if (stockFilter === "IN_STOCK") {
              setStockFilter("ALL");
            } else {
              setStockFilter("IN_STOCK");
              setCurrentPage(1);
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            stockFilter === "IN_STOCK"
              ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-emerald-400 hover:shadow-xs"
          }`}
          title="Click to filter healthy in-stock products (10+ units)"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              In Stock
            </span>
            <div className="flex items-center gap-1.5">
              {stockFilter === "IN_STOCK" && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                  Filtered
                </span>
              )}
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              {loading ? "..." : inStockCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">10+ units</span>
          </div>
        </div>

        {/* Low / Out of Stock Alert */}
        <div
          onClick={() => {
            if (stockFilter === "ALERT") {
              setStockFilter("ALL");
            } else {
              setStockFilter("ALERT");
              setCurrentPage(1);
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            stockFilter === "ALERT"
              ? "border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-amber-400 hover:shadow-xs"
          }`}
          title="Click to filter low stock (<10) and out of stock items"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Inventory Alert
            </span>
            <div className="flex items-center gap-1.5">
              {stockFilter === "ALERT" && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md">
                  Filtered
                </span>
              )}
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">
              {loading ? "..." : lowStockCount + outOfStockCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">
              {outOfStockCount > 0 ? `${outOfStockCount} out of stock` : `${lowStockCount} low stock`}
            </span>
          </div>
        </div>

        {/* Total Catalog Value */}
        <div className="p-4 rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Total Stock Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-blue-800 truncate">
              {loading ? "..." : `Rs. ${totalCatalogValue.toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Unified Product Management Container */}
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-[#1A1613]/10 space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1613]/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name, description, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-10 pr-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] text-xs text-[#1A1613] placeholder:text-[#1A1613]/40 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1613]/40 hover:text-[#1A1613] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls: Category, Stock, Sort & View Mode */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Category Dropdown */}
              <div className="relative flex-1 min-w-[130px] sm:flex-initial sm:min-w-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B] cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Filter Dropdown */}
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-[120px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B] cursor-pointer"
              >
                <option value="ALL">All Stock</option>
                <option value="IN_STOCK">In Stock (10+)</option>
                <option value="LOW_STOCK">Low Stock (&lt;10)</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="ALERT">Inventory Alerts (&lt;10 &amp; Out)</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 min-w-[130px] sm:flex-initial sm:min-w-0 h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B] cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_desc">Stock: High to Low</option>
                <option value="stock_asc">Stock: Low to High</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>

              {/* Reset Filter Button */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-9 px-3 rounded-lg border border-dashed border-[#1A1613]/25 text-xs font-semibold text-[#1A1613]/70 hover:text-[#E6540B] hover:border-[#E6540B] transition-colors cursor-pointer"
                  title="Reset all search & filters"
                >
                  Reset
                </button>
              )}

              {/* View Switcher: Table / Grid */}
              <div className="flex items-center rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] p-0.5 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[#E6540B] text-white shadow-xs"
                      : "text-[#1A1613]/60 hover:text-[#1A1613]"
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#E6540B] text-white shadow-xs"
                      : "text-[#1A1613]/60 hover:text-[#1A1613]"
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Category Filter Indicator */}
        {selectedCategory !== "ALL" && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#E6540B]/10 border-b border-[#E6540B]/20 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <Package className="w-4 h-4 text-[#E6540B] shrink-0" />
              <span className="text-[#1A1613]/70 truncate">
                Filtered by category:{" "}
                <span className="font-bold text-[#1A1613]">
                  {activeCategoryObj?.categoryName ||
                    (location.state as any)?.categoryName ||
                    "Selected Category"}
                </span>
              </span>
              <span className="inline-flex px-2 py-0.5 rounded-full bg-[#E6540B]/15 text-[#E6540B] text-[11px] font-semibold shrink-0">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCategoryChange("ALL")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E6540B]/30 text-xs font-semibold text-[#E6540B] hover:bg-[#E6540B]/10 transition-all cursor-pointer shrink-0"
              title="Clear category filter to view all products"
            >
              <X className="w-3.5 h-3.5" />
              <span>View All Products</span>
            </button>
          </div>
        )}

        {/* 3. Main Content: Table or Grid */}
        {viewMode === "table" ? (
          <ProductTable
            products={paginatedProducts}
            loading={loading}
            onView={(prod) => setViewingProduct(prod)}
            onEdit={handleOpenEdit}
            onQuickStock={(prod) => setStockProduct(prod)}
            onDelete={(prod) => setDeletingProduct(prod)}
            onCopyId={handleCopyId}
            copiedId={copiedId}
            formatDate={formatDate}
          />
        ) : (
          <ProductGrid
            products={paginatedProducts}
            loading={loading}
            onView={(prod) => setViewingProduct(prod)}
            onEdit={handleOpenEdit}
            onQuickStock={(prod) => setStockProduct(prod)}
            onDelete={(prod) => setDeletingProduct(prod)}
            formatDate={formatDate}
          />
        )}

        {/* 4. Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[#1A1613]/10 text-xs text-[#1A1613]/60 bg-[#FDF8ED]/30">
          <div>
            {loading ? (
              <div className="h-3.5 w-32 rounded bg-[#1A1613]/10 animate-pulse" />
            ) : filteredProducts.length === 0 ? (
              "Showing 0 products"
            ) : (
              `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(
                currentPage * pageSize,
                filteredProducts.length
              )} of ${filteredProducts.length} product${
                filteredProducts.length === 1 ? "" : "s"
              }`
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={loading || currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#1A1613]/15 text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                totalPages > 5 &&
                pageNum !== 1 &&
                pageNum !== totalPages &&
                Math.abs(pageNum - currentPage) > 1
              ) {
                if (Math.abs(pageNum - currentPage) === 2) {
                  return (
                    <span key={`dots-${pageNum}`} className="px-1 text-[#1A1613]/40">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-[#E6540B] text-white shadow-xs"
                      : "border border-[#1A1613]/15 text-[#1A1613] hover:bg-[#F4EEDF]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={loading || currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#1A1613]/15 text-[#1A1613] hover:bg-[#F4EEDF] disabled:opacity-40 transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Modals */}
      <ProductModal
        isOpen={isModalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        loading={actionLoading}
      />

      <ProductViewModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onEdit={(prod) => {
          setViewingProduct(null);
          handleOpenEdit(prod);
        }}
        onQuickStock={(prod) => setStockProduct(prod)}
        onCopyId={handleCopyId}
        copiedId={copiedId}
        formatDate={formatDate}
      />

      <ProductStockModal
        isOpen={Boolean(stockProduct)}
        product={stockProduct}
        onClose={() => setStockProduct(null)}
        onUpdateStock={handleStockUpdate}
        loading={actionLoading}
      />

      <ProductDeleteModal
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
      />
    </div>
  );
};

export default ProductManagement;
