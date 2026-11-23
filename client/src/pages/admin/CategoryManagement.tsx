import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, ExternalLink, ImagePlus, Layers, Loader2, Package, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  addAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
} from "../../store/admin/categorySlice";
import { fetchCategories as syncStoreCategories } from "../../store/customer/categorySlice";
import { fetchDatas as syncDashboard } from "../../store/admin/datasSlice";
import { AdminCategory } from "../../types/admin/categoryTypes";
import { Status } from "../../global/statuses";
import { Skeleton } from "../../global/Skeleton";
import { hideBrokenImage, optimizeImageUrl } from "../../utils/helpers";

const NAME_MIN = 2;
const NAME_MAX = 40;
const DESCRIPTION_MIN = 5;
const DESCRIPTION_MAX = 200;
const MAX_IMAGE_MB = 10;
const PAGE_SIZE = 12;

type Filter = "ALL" | "WITH_PRODUCTS" | "EMPTY";
type Sort = "newest" | "name" | "products";

const card = "rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] dark:border-white/10 dark:bg-[#1E1A17]";
const muted = "text-[#1A1613]/60 dark:text-[#F5EFE6]/55";
const strong = "text-[#1A1613] dark:text-[#F5EFE6]";
const control =
  "rounded-lg border border-[#1A1613]/15 bg-white px-3 py-2 text-sm text-[#1A1613] focus:outline-none focus:ring-2 focus:ring-[#E6540B]/30 dark:border-white/10 dark:bg-[#14110F] dark:text-[#F5EFE6] dark:scheme-dark";
const secondaryButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/15 bg-[#FFFDF8] px-3 py-1.5 text-sm font-medium text-[#1A1613] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1E1A17] dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]";
const primaryButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#E6540B] px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[#c94806] disabled:cursor-not-allowed disabled:opacity-60";

/** Add / edit form. Mounted fresh each time it opens, so it always starts from the right values. */
const CategoryForm = ({
  category,
  saving,
  onCancel,
  onSave,
}: {
  category: AdminCategory | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (data: FormData) => void;
}) => {
  const [name, setName] = useState(category?.categoryName ?? "");
  const [description, setDescription] = useState(category?.categoryDescription ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(category?.categoryImage || null);
  const [errors, setErrors] = useState<{ name?: string; description?: string; image?: string }>({});

  // Free the temporary preview URL when it's replaced or the form closes
  useEffect(() => () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  const pickImage = (picked?: File) => {
    if (!picked) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(picked.type)) {
      setErrors((prev) => ({ ...prev, image: "Use a JPG, PNG or WebP image." }));
      return;
    }
    if (picked.size > MAX_IMAGE_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: `The image must be under ${MAX_IMAGE_MB} MB.` }));
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const d = description.trim();
    const next: typeof errors = {};
    if (n.length < NAME_MIN || n.length > NAME_MAX) next.name = `Use ${NAME_MIN}–${NAME_MAX} characters.`;
    if (d.length < DESCRIPTION_MIN || d.length > DESCRIPTION_MAX) next.description = `Use ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters.`;
    if (!category && !file) next.image = "Add an image for this category.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const data = new FormData();
    data.append("categoryName", n);
    data.append("categoryDescription", d);
    if (file) data.append("categoryImage", file);
    onSave(data);
  };

  const field = (hasError: boolean) => `${control} w-full ${hasError ? "border-red-400 dark:border-red-500/60" : ""}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} noValidate className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17] sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-lg font-bold ${strong}`}>{category ? `Edit ${category.categoryName}` : "New category"}</h2>
          <button type="button" onClick={onCancel} disabled={saving} aria-label="Close" className={`cursor-pointer rounded-lg p-1.5 ${muted} hover:bg-[#F4EEDF] dark:hover:bg-[#2A2420]`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block">
          <span className={`mb-1 block text-sm font-medium ${strong}`}>Image</span>
          <span
            className={`relative flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-[#F4EEDF]/50 dark:bg-white/5 ${
              errors.image ? "border-red-400" : "border-[#1A1613]/15 hover:border-[#E6540B]/50 dark:border-white/15"
            }`}
          >
            {preview ? (
              <>
                <img src={preview} alt="" className="h-full w-full object-cover" />
                <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">Change image</span>
              </>
            ) : (
              <span className={`flex flex-col items-center gap-1 text-sm ${muted}`}>
                <ImagePlus className="h-7 w-7" />
                Choose an image
                <span className="text-xs">JPG, PNG or WebP, up to {MAX_IMAGE_MB} MB</span>
              </span>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0])} />
          </span>
          {errors.image && <span className="mt-1 block text-xs text-red-700 dark:text-red-400">{errors.image}</span>}
        </label>

        <div className="mt-4">
          <div className="mb-1 flex justify-between">
            <label htmlFor="category-name" className={`text-sm font-medium ${strong}`}>Name</label>
            <span className={`text-xs ${muted}`}>{name.trim().length}/{NAME_MAX}</span>
          </div>
          <input
            id="category-name"
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="e.g. Kitchen & Dining"
            className={field(!!errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{errors.name}</p>}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between">
            <label htmlFor="category-description" className={`text-sm font-medium ${strong}`}>Description</label>
            <span className={`text-xs ${muted}`}>{description.trim().length}/{DESCRIPTION_MAX}</span>
          </div>
          <textarea
            id="category-description"
            value={description}
            maxLength={DESCRIPTION_MAX}
            rows={3}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="A short line shoppers see on the category"
            className={`${field(!!errors.description)} resize-none`}
          />
          {errors.description && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{errors.description}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {category ? "Save changes" : "Create category"}
          </button>
        </div>
      </form>
    </div>
  );
};

const CategoryManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { categories, status, actionLoading, error } = useAppSelector((state) => state.adminCategory);
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);
  const [moveTo, setMoveTo] = useState("");

  useEffect(() => {
    dispatch(fetchAdminCategories());
  }, [dispatch]);

  // Keep the storefront menu and the dashboard numbers in step after a change
  const syncElsewhere = () => {
    dispatch(syncStoreCategories());
    dispatch(syncDashboard()).catch(() => {});
  };

  const save = async (data: FormData) => {
    const result = editing && editing !== "new"
      ? await dispatch(updateAdminCategory(editing.id, data))
      : await dispatch(addAdminCategory(data));
    if (result?.success) {
      setEditing(null);
      syncElsewhere();
    }
  };

  const openDelete = (category: AdminCategory) => {
    setToDelete(category);
    setMoveTo("");
  };

  const toDeleteCount = toDelete?.totalProducts || 0;
  const moveTargets = toDelete ? categories.filter((c) => c.id !== toDelete.id) : [];

  const confirmDelete = async () => {
    if (!toDelete || (toDeleteCount > 0 && !moveTo)) return;
    const result = await dispatch(deleteAdminCategory(toDelete.id, toDeleteCount > 0 ? moveTo : undefined));
    if (result?.success) {
      syncElsewhere();
      setToDelete(null);
    }
  };

  const withProducts = categories.filter((c) => (c.totalProducts || 0) > 0).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.totalProducts || 0), 0);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .filter((c) => (filter === "WITH_PRODUCTS" ? (c.totalProducts || 0) > 0 : filter === "EMPTY" ? !c.totalProducts : true))
      .filter((c) => !q || c.categoryName.toLowerCase().includes(q) || c.categoryDescription?.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "name"
          ? a.categoryName.localeCompare(b.categoryName)
          : sort === "products"
            ? (b.totalProducts || 0) - (a.totalProducts || 0)
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [categories, filter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const firstLoad = (status === Status.IDLE || status === Status.LOADING) && categories.length === 0;
  const refreshing = status === Status.LOADING;

  const stats: { key: Filter | "PRODUCTS"; label: string; value: number; hint: string; icon: typeof Layers; tone: string }[] = [
    { key: "ALL", label: "Categories", value: categories.length, hint: "Show all", icon: Layers, tone: "bg-[#E6540B]/10 text-[#E6540B] dark:bg-[#E6540B]/15" },
    { key: "WITH_PRODUCTS", label: "With products", value: withProducts, hint: "Show only these", icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
    { key: "EMPTY", label: "Empty", value: categories.length - withProducts, hint: "Show only these", icon: AlertCircle, tone: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
    { key: "PRODUCTS", label: "Products", value: totalProducts, hint: "In all categories", icon: Package, tone: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold sm:text-3xl ${strong}`}>Categories</h1>
          <p className={`mt-1 text-sm ${muted}`}>Group your products so shoppers can browse them.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => dispatch(fetchAdminCategories())} disabled={refreshing} className={secondaryButton}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button type="button" onClick={() => setEditing("new")} className={primaryButton}>
            <Plus className="h-4 w-4" /> Add category
          </button>
        </div>
      </div>

      {/* Numbers; the first three also filter the list */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const clickable = stat.key !== "PRODUCTS";
          const active = clickable && filter === stat.key && stat.key !== "ALL";
          const Icon = stat.icon;
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm ${muted}`}>{stat.label}</p>
                  {firstLoad ? <Skeleton className="mt-1 h-7 w-12" /> : <p className={`mt-1 text-2xl font-bold ${strong}`}>{stat.value}</p>}
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className={`mt-1 text-xs ${muted}`}>{active ? "Showing these · click to show all" : stat.hint}</p>
            </>
          );
          return clickable ? (
            <button
              key={stat.key}
              type="button"
              onClick={() => {
                setFilter(active || stat.key === "ALL" ? "ALL" : (stat.key as Filter));
                setPage(1);
              }}
              aria-pressed={active}
              className={`${card} cursor-pointer p-4 text-left transition hover:border-[#1A1613]/25 dark:hover:border-white/25 ${active ? "!border-[#E6540B] ring-2 ring-[#E6540B]/15" : ""}`}
            >
              {body}
            </button>
          ) : (
            <div key={stat.key} className={`${card} p-4`}>
              {body}
            </div>
          );
        })}
      </div>

      <section className={card}>
        <div className="flex flex-col gap-2 border-b border-[#1A1613]/10 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1613]/40 dark:text-[#F5EFE6]/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search categories"
              aria-label="Search categories"
              className={`${control} w-full pl-9`}
            />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort categories" className={`${control} cursor-pointer`}>
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="products">Most products</option>
          </select>
        </div>

        {firstLoad ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[16/9] rounded-xl" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : status === Status.ERROR && categories.length === 0 ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            {error || "Couldn't load categories."}{" "}
            <button type="button" onClick={() => dispatch(fetchAdminCategories())} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">
              Try again
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center">
            <p className={`font-semibold ${strong}`}>No categories yet</p>
            <p className={`mt-1 text-sm ${muted}`}>Create one so you can start adding products to it.</p>
            <button type="button" onClick={() => setEditing("new")} className={`${primaryButton} mt-4`}>
              <Plus className="h-4 w-4" /> Add category
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            No categories match.{" "}
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("ALL");
              }}
              className="cursor-pointer font-semibold text-[#E6540B] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((category) => {
                const count = category.totalProducts || 0;
                return (
                  <li key={category.id} className="flex flex-col overflow-hidden rounded-xl border border-[#1A1613]/10 dark:border-white/10">
                    <div className="relative aspect-[16/9] bg-[#F4EEDF] dark:bg-white/5">
                      <Layers className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[#1A1613]/20 dark:text-[#F5EFE6]/20" />
                      {category.categoryImage && (
                        <img
                          src={optimizeImageUrl(category.categoryImage, 600)}
                          alt=""
                          loading="lazy"
                          onError={hideBrokenImage}
                          className="relative h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`line-clamp-1 font-semibold ${strong}`} title={category.categoryName}>
                          {category.categoryName}
                        </h3>
                        <Link
                          to={`/admin-dashboard/products?category=${category.id}`}
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            count > 0
                              ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}
                          title="See these products"
                        >
                          {count} {count === 1 ? "product" : "products"}
                        </Link>
                      </div>
                      <p className={`mt-1 line-clamp-2 text-sm ${muted}`}>{category.categoryDescription}</p>
                      <div className="mt-auto flex items-center gap-1 pt-3">
                        <button type="button" onClick={() => setEditing(category)} className={`${secondaryButton} px-2.5 py-1 text-xs`}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <a
                          href={`/products?category=${category.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${secondaryButton} px-2.5 py-1 text-xs`}
                          title="Open this category in the store"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </a>
                        <button
                          type="button"
                          onClick={() => openDelete(category)}
                          title={count > 0 ? "Delete (you'll choose where its products go)" : "Delete category"}
                          aria-label={`Delete ${category.categoryName}`}
                          className="ml-auto cursor-pointer rounded-lg p-1.5 text-[#1A1613]/50 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#F5EFE6]/50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {totalPages > 1 && (
              <div className={`flex items-center justify-between border-t border-[#1A1613]/10 px-4 py-3 text-sm dark:border-white/10 ${muted}`}>
                <span>
                  {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visible.length)} of {visible.length}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className={secondaryButton}>
                    Previous
                  </button>
                  <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} className={secondaryButton}>
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {editing && (
        <CategoryForm
          key={editing === "new" ? "new" : editing.id}
          category={editing === "new" ? null : editing}
          saving={actionLoading}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      {toDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
            <h2 className={`text-lg font-bold ${strong}`}>Delete {toDelete.categoryName}?</h2>
            <p className={`mt-2 text-sm ${muted}`}>It disappears from the store menu and filters. This can't be undone.</p>
            {toDeleteCount > 0 &&
              (moveTargets.length === 0 ? (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-300">
                  It has {toDeleteCount} {toDeleteCount === 1 ? "product" : "products"} and there's no other category to move them to.
                  Create another category first.
                </p>
              ) : (
                <div className="mt-3">
                  <label htmlFor="move-products" className={`mb-1 block text-sm font-medium ${strong}`}>
                    Move its {toDeleteCount} {toDeleteCount === 1 ? "product" : "products"} to
                  </label>
                  <select
                    id="move-products"
                    value={moveTo}
                    onChange={(e) => setMoveTo(e.target.value)}
                    className={`${control} w-full cursor-pointer`}
                  >
                    <option value="">Choose a category…</option>
                    {moveTargets.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.categoryName} ({c.totalProducts || 0})
                      </option>
                    ))}
                  </select>
                  <p className={`mt-1 text-xs ${muted}`}>The products stay on sale; only their category changes.</p>
                </div>
              ))}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setToDelete(null)} disabled={actionLoading} className={secondaryButton}>
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading || (toDeleteCount > 0 && !moveTo)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {toDeleteCount > 0 ? `Move ${toDeleteCount} and delete` : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
