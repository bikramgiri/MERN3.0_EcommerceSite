import React, { useEffect, useState, useMemo } from "react";
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  X,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Package,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  fetchAdminCategories,
  addAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../../store/admin/categorySlice";
import { fetchCategories as syncCustomerCategories } from "../../store/customer/categorySlice";
import { fetchDatas as syncDashboardStats } from "../../store/admin/datasSlice";
import { AdminCategory } from "../../types/admin/categoryTypes";
import { Status } from "../../global/statuses";
import CategoryTable from "../../components/admin/Categories/CategoryTable";
import CategoryGrid from "../../components/admin/Categories/CategoryGrid";
import CategoryModal from "../../components/admin/Categories/CategoryModal";
import CategoryViewModal from "../../components/admin/Categories/CategoryViewModal";
import CategoryDeleteModal from "../../components/admin/Categories/CategoryDeleteModal";

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const CategoryManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categories, status, actionLoading } = useAppSelector(
    (state) => state.adminCategory
  );

  // Search, filter & view state
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState<"ALL" | "ACTIVE" | "EMPTY">("ALL");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "name_asc" | "name_desc" | "products_desc"
  >("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const isFiltered =
    searchTerm.trim() !== "" ||
    productFilter !== "ALL" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchTerm("");
    setProductFilter("ALL");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null
  );
  const [viewingCategory, setViewingCategory] = useState<AdminCategory | null>(
    null
  );
  const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    dispatch(fetchAdminCategories());
  }, [dispatch]);

  const handleRefresh = async () => {
    await dispatch(fetchAdminCategories());
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: FormData): Promise<boolean> => {
    let result;
    if (editingCategory) {
      result = await dispatch(
        updateAdminCategory(editingCategory.id, formData)
      );
    } else {
      result = await dispatch(addAdminCategory(formData));
    }

    if (result && result.success) {
      dispatch(syncCustomerCategories());
      dispatch(syncDashboardStats());
      return true;
    }
    return false;
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    const result = await dispatch(deleteAdminCategory(deletingCategory.id));
    if (result && result.success) {
      setDeletingCategory(null);
      dispatch(syncCustomerCategories());
      dispatch(syncDashboardStats());
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter & sort categories
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = cat.categoryName?.toLowerCase().includes(q);
          const matchDesc = cat.categoryDescription?.toLowerCase().includes(q);
          const matchId = cat.id?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchId) {
            return false;
          }
        }

        // Product count filter
        if (productFilter === "ACTIVE") {
          if ((cat.totalProducts || 0) <= 0) return false;
        } else if (productFilter === "EMPTY") {
          if ((cat.totalProducts || 0) > 0) return false;
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
        if (sortBy === "name_asc") {
          return (a.categoryName || "").localeCompare(b.categoryName || "");
        }
        if (sortBy === "name_desc") {
          return (b.categoryName || "").localeCompare(a.categoryName || "");
        }
        if (sortBy === "products_desc") {
          return (b.totalProducts || 0) - (a.totalProducts || 0);
        }
        return 0;
      });
  }, [categories, searchTerm, productFilter, sortBy]);

  // Paginated records
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / pageSize)
  );
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const isLoading = status === Status.LOADING;

  // KPI Metrics
  const totalCategoriesCount = categories.length;
  const activeCategoriesCount = categories.filter(
    (c) => (c.totalProducts || 0) > 0
  ).length;
  const emptyCategoriesCount = categories.filter(
    (c) => (c.totalProducts || 0) === 0
  ).length;
  const totalAssignedProducts = categories.reduce(
    (sum, c) => sum + (c.totalProducts || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6540B]/10 text-[#E6540B]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[#1A1613] sm:text-2xl">
                  Category Management
                </h1>
              </div>
              <p className="text-xs text-[#1A1613]/60 mt-0.5">
                Organize, manage, and curate store product categories
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1A1613]/15 bg-[#FFFDF8] px-4 py-2.5 text-xs font-semibold text-[#1A1613] shadow-xs hover:bg-[#F4EEDF] transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoading ? "animate-spin text-[#E6540B]" : ""
              }`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E6540B] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#d44c0a] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Categories */}
        <div
          onClick={handleResetFilters}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            !isFiltered
              ? "border-[#E6540B]/40 bg-[#FFFDF8] shadow-xs"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-[#E6540B]/40"
          }`}
          title="Click to reset filters and view all categories"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Total Categories
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A1613]">
              {isLoading ? "..." : totalCategoriesCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">in catalog</span>
          </div>
        </div>

        {/* Active Collections */}
        <div
          onClick={() => {
            if (productFilter === "ACTIVE") {
              setProductFilter("ALL");
            } else {
              setProductFilter("ACTIVE");
              setCurrentPage(1);
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            productFilter === "ACTIVE"
              ? "border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-emerald-400 hover:shadow-xs"
          }`}
          title="Click to filter categories with products (>0)"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Active Collections
            </span>
            <div className="flex items-center gap-1.5">
              {productFilter === "ACTIVE" && (
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
              {isLoading ? "..." : activeCategoriesCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">with products</span>
          </div>
        </div>

        {/* Empty Collections */}
        <div
          onClick={() => {
            if (productFilter === "EMPTY") {
              setProductFilter("ALL");
            } else {
              setProductFilter("EMPTY");
              setCurrentPage(1);
            }
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
            productFilter === "EMPTY"
              ? "border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20"
              : "border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs hover:border-amber-400 hover:shadow-xs"
          }`}
          title="Click to filter empty categories needing products (0)"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Empty Collections
            </span>
            <div className="flex items-center gap-1.5">
              {productFilter === "EMPTY" && (
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
              {isLoading ? "..." : emptyCategoriesCount}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">
              {emptyCategoriesCount > 0 ? "needs products" : "all populated"}
            </span>
          </div>
        </div>

        {/* Total Assigned Products */}
        <div className="p-4 rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#1A1613]/60">
              Assigned Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-800">
              {isLoading ? "..." : totalAssignedProducts}
            </span>
            <span className="text-[11px] text-[#1A1613]/40">classified items</span>
          </div>
        </div>
      </div>

      {/* 3. Search, Sort, View Controls & Content Block */}
      <div className="rounded-xl border border-[#1A1613]/10 bg-[#FFFDF8] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#1A1613]/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1A1613]/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories by name, description, or ID..."
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

            {/* Right Controls: Filter, Sort & View Toggle */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Product Count / Status Filter Dropdown */}
              <select
                value={productFilter}
                onChange={(e) => {
                  setProductFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 text-xs font-medium text-[#1A1613] focus:outline-none focus:border-[#E6540B] cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="ACTIVE">With Products (&gt;0)</option>
                <option value="EMPTY">Empty Collections (0)</option>
              </select>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] px-3 h-9 text-xs text-[#1A1613]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#1A1613]/50" />
                <span className="text-[#1A1613]/50 text-[11px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-semibold text-xs text-[#1A1613] focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name_asc">Name (A - Z)</option>
                  <option value="name_desc">Name (Z - A)</option>
                  <option value="products_desc">Most Products</option>
                </select>
              </div>

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

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-[#1A1613]/15 bg-[#FDF8ED] p-0.5">
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
                  title="Grid Cards View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category List (Skeleton on initial loading) */}
        {isLoading && categories.length === 0 ? (
          viewMode === "table" ? (
            <CategoryTable
              categories={[]}
              loading={true}
              onView={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onCopyId={() => {}}
              copiedId={null}
              formatDate={formatDate}
            />
          ) : (
            <CategoryGrid
              categories={[]}
              loading={true}
              onView={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              formatDate={formatDate}
            />
          )
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#E6540B]/10 text-[#E6540B] flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1A1613]">
              No categories found
            </h3>
            <p className="text-xs text-[#1A1613]/50 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? `No categories match "${searchTerm}". Try a different search keyword.`
                : "You have not created any categories yet. Add your first category to organize your catalog."}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg border border-[#1A1613]/15 px-3 py-1.5 text-xs font-semibold text-[#1A1613] hover:bg-[#F4EEDF]"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-[#E6540B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#d44c0a]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Category</span>
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          <CategoryTable
            categories={paginatedCategories}
            onView={(cat) => setViewingCategory(cat)}
            onEdit={handleOpenEdit}
            onDelete={(cat) => setDeletingCategory(cat)}
            onCopyId={handleCopyId}
            copiedId={copiedId}
            formatDate={formatDate}
          />
        ) : (
          <CategoryGrid
            categories={paginatedCategories}
            onView={(cat) => setViewingCategory(cat)}
            onEdit={handleOpenEdit}
            onDelete={(cat) => setDeletingCategory(cat)}
            formatDate={formatDate}
          />
        )}

        {/* Pagination */}
        {filteredCategories.length > 0 && (
          <div className="p-4 border-t border-[#1A1613]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#1A1613]/60">
            <div>
              Showing{" "}
              <span className="font-semibold text-[#1A1613]">
                {Math.min(
                  filteredCategories.length,
                  (currentPage - 1) * pageSize + 1
                )}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-[#1A1613]">
                {Math.min(currentPage * pageSize, filteredCategories.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#1A1613]">
                {filteredCategories.length}
              </span>{" "}
              categories
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#1A1613]/15 text-[#1A1613] disabled:opacity-40 hover:bg-[#F4EEDF] transition-all"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === page
                        ? "bg-[#E6540B] text-white"
                        : "text-[#1A1613]/70 hover:bg-[#F4EEDF]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#1A1613]/15 text-[#1A1613] disabled:opacity-40 hover:bg-[#F4EEDF] transition-all"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isModalOpen}
        category={editingCategory}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        loading={actionLoading}
      />

      <CategoryViewModal
        category={viewingCategory}
        onClose={() => setViewingCategory(null)}
        onEdit={(cat) => {
          setViewingCategory(null);
          handleOpenEdit(cat);
        }}
        onCopyId={handleCopyId}
        copiedId={copiedId}
        formatDate={formatDate}
      />

      <CategoryDeleteModal
        category={deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
      />
    </div>
  );
};

export default CategoryManagement;
