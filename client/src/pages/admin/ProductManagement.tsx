import React, { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  ImagePlus,
  Loader2,
  Minus,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  addAdminProduct,
  deleteAdminProduct,
  fetchAdminProductOrders,
  fetchAdminProducts,
  updateAdminProduct,
  updateAdminProductStock,
} from "../../store/admin/productSlice";
import { fetchAdminCategories } from "../../store/admin/categorySlice";
import { fetchDatas as syncDashboard } from "../../store/admin/datasSlice";
import type { AdminProduct, ProductOrderItem } from "../../types/admin/productTypes";
import { Status } from "../../global/statuses";
import { Skeleton } from "../../global/Skeleton";
import { connectSocket } from "../../services/socket";
import { formatOrderNumber, useStoreSettings } from "../../services/storeSettingsService";
import { hideBrokenImage, optimizeImageUrl } from "../../utils/helpers";

const NAME_MAX = 80;
const DESCRIPTION_MIN = 5;
const DESCRIPTION_MAX = 2000;
const MAX_IMAGE_MB = 10;
const PAGE_SIZE = 10;

type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ALERT";
type Sort = "newest" | "name" | "price_asc" | "price_desc" | "stock_asc";

const card = "rounded-2xl border border-[#1A1613]/10 bg-[#FFFDF8] dark:border-white/10 dark:bg-[#1E1A17]";
const muted = "text-[#1A1613]/60 dark:text-[#F5EFE6]/55";
const strong = "text-[#1A1613] dark:text-[#F5EFE6]";
const control =
  "rounded-lg border border-[#1A1613]/15 bg-white px-3 py-2 text-sm text-[#1A1613] focus:outline-none focus:ring-2 focus:ring-[#E6540B]/30 dark:border-white/10 dark:bg-[#14110F] dark:text-[#F5EFE6] dark:scheme-dark";
const secondaryButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/15 bg-[#FFFDF8] px-3 py-1.5 text-sm font-medium text-[#1A1613] hover:bg-[#F4EEDF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#1E1A17] dark:text-[#F5EFE6] dark:hover:bg-[#2A2420]";
const primaryButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#E6540B] px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[#c94806] disabled:cursor-not-allowed disabled:opacity-60";
const iconButton =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#1A1613]/60 hover:bg-[#F4EEDF] hover:text-[#1A1613] dark:text-[#F5EFE6]/60 dark:hover:bg-[#2A2420] dark:hover:text-[#F5EFE6]";

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;
const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
/** Same rule as the server: price minus the discount, rounded to whole rupees */
const sellingPriceOf = (listPrice: number, discount: number) =>
  discount > 0 ? Math.round(listPrice - (listPrice * discount) / 100) : listPrice;
const listPriceOf = (p: AdminProduct) => p.listPrice ?? p.productPrice;
const categoryOf = (p: AdminProduct) => p.category?.categoryName || p.Category?.categoryName || "No category";
const ratingOf = (p: AdminProduct) => {
  const reviews = p.reviews || [];
  return reviews.length ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;
};

const StockBadge = ({ stock, low }: { stock: number; low: number }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
      stock <= 0
        ? "bg-red-500/10 text-red-700 dark:text-red-400"
        : stock <= low
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    }`}
  >
    {stock <= 0 ? "Out of stock" : `${stock} in stock`}
  </span>
);

const Price = ({ product }: { product: AdminProduct }) => (
  <div>
    <span className={`font-semibold ${strong}`}>{rs(product.productPrice)}</span>
    {product.productDiscount > 0 && (
      <span className={`ml-1.5 text-xs ${muted}`}>
        <s>{rs(listPriceOf(product))}</s> · −{product.productDiscount}%
      </span>
    )}
  </div>
);

/** Add / edit form, mounted fresh each time it opens */
const ProductForm = ({
  product,
  categories,
  saving,
  onCancel,
  onSave,
}: {
  product: AdminProduct | null;
  categories: { id: string; categoryName: string }[];
  saving: boolean;
  onCancel: () => void;
  onSave: (data: FormData) => void;
}) => {
  const [name, setName] = useState(product?.productName ?? "");
  const [description, setDescription] = useState(product?.productDescription ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [price, setPrice] = useState(product ? String(listPriceOf(product)) : "");
  const [discount, setDiscount] = useState(product ? String(product.productDiscount || 0) : "0");
  const [stock, setStock] = useState(product ? String(product.productStock) : "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product?.productImage || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  const numericPrice = Number(price);
  const numericDiscount = Number(discount) || 0;
  const customerPays = numericPrice > 0 ? sellingPriceOf(numericPrice, numericDiscount) : 0;

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
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const clear = (key: string) => setErrors((prev) => ({ ...prev, [key]: "" }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const n = name.trim();
    const d = description.trim();
    const s = Number(stock);
    if (n.length < 2 || n.length > NAME_MAX) next.name = `Use 2–${NAME_MAX} characters.`;
    if (d.length < DESCRIPTION_MIN || d.length > DESCRIPTION_MAX) next.description = `Use ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters.`;
    if (!categoryId) next.category = "Choose a category.";
    if (!(numericPrice > 0)) next.price = "Enter a price above 0.";
    if (!Number.isInteger(numericDiscount) || numericDiscount < 0 || numericDiscount > 90) next.discount = "0–90, whole numbers.";
    if (stock === "" || !Number.isInteger(s) || s < 0) next.stock = "Whole number, 0 or more.";
    if (!product && !file) next.image = "Add a product image.";
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const data = new FormData();
    data.append("productName", n);
    data.append("productDescription", d);
    data.append("categoryId", categoryId);
    data.append("productPrice", String(numericPrice));
    data.append("productDiscount", String(numericDiscount));
    data.append("productStock", String(s));
    if (file) data.append("productImage", file);
    onSave(data);
  };

  const field = (key: string) => `${control} w-full ${errors[key] ? "border-red-400 dark:border-red-500/60" : ""}`;
  const error = (key: string) => errors[key] && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{errors[key]}</p>;
  const labelClass = `mb-1 block text-sm font-medium ${strong}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} noValidate className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17] sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-lg font-bold ${strong}`}>{product ? `Edit ${product.productName}` : "New product"}</h2>
          <button type="button" onClick={onCancel} disabled={saving} aria-label="Close" className={iconButton}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
          <label className="block">
            <span className={labelClass}>Image</span>
            <span
              className={`relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-[#F4EEDF]/50 dark:bg-white/5 ${
                errors.image ? "border-red-400" : "border-[#1A1613]/15 hover:border-[#E6540B]/50 dark:border-white/15"
              }`}
            >
              {preview ? (
                <>
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                    Change image
                  </span>
                </>
              ) : (
                <span className={`flex flex-col items-center gap-1 p-3 text-center text-sm ${muted}`}>
                  <ImagePlus className="h-7 w-7" />
                  Choose an image
                  <span className="text-xs">JPG, PNG or WebP, up to {MAX_IMAGE_MB} MB</span>
                </span>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0])} />
            </span>
            {error("image")}
          </label>

          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between">
                <label htmlFor="product-name" className={`text-sm font-medium ${strong}`}>Name</label>
                <span className={`text-xs ${muted}`}>{name.trim().length}/{NAME_MAX}</span>
              </div>
              <input id="product-name" value={name} maxLength={NAME_MAX} onChange={(e) => { setName(e.target.value); clear("name"); }} className={field("name")} />
              {error("name")}
            </div>
            <div>
              <label htmlFor="product-category" className={labelClass}>Category</label>
              <select id="product-category" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); clear("category"); }} className={`${field("category")} cursor-pointer`}>
                <option value="">Choose a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.categoryName}</option>
                ))}
              </select>
              {error("category")}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="product-price" className={labelClass}>Price (Rs)</label>
                <input id="product-price" type="number" min={1} step="any" inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); clear("price"); }} className={field("price")} />
                {error("price")}
              </div>
              <div>
                <label htmlFor="product-discount" className={labelClass}>Discount %</label>
                <input id="product-discount" type="number" min={0} max={90} step={1} value={discount} onChange={(e) => { setDiscount(e.target.value); clear("discount"); }} className={field("discount")} />
                {error("discount")}
              </div>
              <div>
                <label htmlFor="product-stock" className={labelClass}>Stock</label>
                <input id="product-stock" type="number" min={0} step={1} value={stock} onChange={(e) => { setStock(e.target.value); clear("stock"); }} className={field("stock")} />
                {error("stock")}
              </div>
            </div>
            {customerPays > 0 && (
              <p className={`rounded-lg bg-[#F4EEDF]/70 px-3 py-2 text-sm dark:bg-white/5 ${muted}`}>
                Customers pay <span className={`font-semibold ${strong}`}>{rs(customerPays)}</span>
                {numericDiscount > 0 && <> (price {rs(numericPrice)} crossed out, −{numericDiscount}%)</>}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between">
            <label htmlFor="product-description" className={`text-sm font-medium ${strong}`}>Description</label>
            <span className={`text-xs ${muted}`}>{description.trim().length}/{DESCRIPTION_MAX}</span>
          </div>
          <textarea
            id="product-description"
            value={description}
            maxLength={DESCRIPTION_MAX}
            rows={4}
            onChange={(e) => { setDescription(e.target.value); clear("description"); }}
            placeholder="What it is, size or weight, materials, what's in the box…"
            className={`${field("description")} resize-y`}
          />
          {error("description")}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className={secondaryButton}>Cancel</button>
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
};

/** Side panel: product summary plus the orders it appears in */
const ProductPanel = ({ product, onClose, onEdit, onStock }: { product: AdminProduct; onClose: () => void; onEdit: () => void; onStock: () => void }) => {
  const dispatch = useAppDispatch();
  const { lowStockThreshold } = useStoreSettings();
  const [orders, setOrders] = useState<ProductOrderItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    dispatch(fetchAdminProductOrders(product.id)).then((result) => {
      if (!current) return;
      if (result?.success) setOrders(result.orders || []);
      else setFailed(true);
    });
    return () => {
      current = false;
    };
  }, [dispatch, product.id]);

  const counted = (orders || []).filter((line) => line.Order && line.Order.orderStatus !== "Cancelled");
  const unitsSold = counted.reduce((sum, line) => sum + (line.quantity || 0), 0);
  const revenue = counted.reduce((sum, line) => sum + (line.quantity || 0) * Number(line.unitPrice ?? product.productPrice), 0);
  const reviews = product.reviews || [];

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/40" role="dialog" aria-modal="true" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto bg-[#FFFDF8] p-5 shadow-xl dark:bg-[#1E1A17]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-xs ${muted}`}>{categoryOf(product)}</p>
            <h2 className={`text-lg font-bold ${strong}`}>{product.productName}</h2>
          </div>
          <button type="button" onClick={onClose} className={iconButton} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-3 aspect-[4/3] overflow-hidden rounded-xl bg-[#F4EEDF] dark:bg-white/5">
          <img src={optimizeImageUrl(product.productImage, 600)} alt="" onError={hideBrokenImage} className="h-full w-full object-cover" />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Price product={product} />
          <StockBadge stock={product.productStock} low={lowStockThreshold} />
        </div>
        <p className={`mt-3 whitespace-pre-line text-sm ${muted}`}>{product.productDescription}</p>

        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Sold", value: orders ? String(unitsSold) : "…" },
            { label: "Revenue", value: orders ? rs(revenue) : "…" },
            { label: "Rating", value: reviews.length ? `${ratingOf(product).toFixed(1)} (${reviews.length})` : "—" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#1A1613]/10 p-3 dark:border-white/10">
              <dt className={`text-xs ${muted}`}>{item.label}</dt>
              <dd className={`mt-0.5 text-sm font-bold ${strong}`}>{item.value}</dd>
            </div>
          ))}
        </dl>

        <h3 className={`mt-6 text-sm font-semibold ${strong}`}>Recent orders</h3>
        {failed ? (
          <p className={`mt-2 text-sm ${muted}`}>Couldn't load orders.</p>
        ) : !orders ? (
          <div className="mt-2 space-y-2"><Skeleton className="h-11 rounded-lg" /><Skeleton className="h-11 rounded-lg" /></div>
        ) : orders.length === 0 ? (
          <p className={`mt-2 text-sm ${muted}`}>Not ordered yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[#1A1613]/8 rounded-xl border border-[#1A1613]/10 dark:divide-white/10 dark:border-white/10">
            {orders.slice(0, 6).map((line) => {
              const label = line.Order ? formatOrderNumber(line.Order.id) : "Order";
              return (
                <li key={line.id}>
                  <Link to={`/admin-dashboard/orders?search=${encodeURIComponent(label)}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-[#F4EEDF]/60 dark:hover:bg-white/5">
                    <span className="min-w-0">
                      <span className={`block font-medium ${strong}`}>{label} · {line.quantity}×</span>
                      <span className={`block truncate text-xs ${muted}`}>
                        {line.Order?.User?.username ?? "Customer"} · {formatDate(line.Order?.createdAt)} · {line.Order?.orderStatus}
                      </span>
                    </span>
                    <span className={`shrink-0 font-semibold ${strong}`}>{rs(line.quantity * Number(line.unitPrice ?? product.productPrice))}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className={primaryButton}><Pencil className="h-4 w-4" /> Edit</button>
          <button type="button" onClick={onStock} className={secondaryButton}><Package className="h-4 w-4" /> Update stock</button>
          <a href={`/productdetails/${product.id}`} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
            <ExternalLink className="h-4 w-4" /> View in store
          </a>
        </div>
      </aside>
    </div>
  );
};

/** Quick stock change without opening the full form */
const StockDialog = ({ product, onClose }: { product: AdminProduct; onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const [value, setValue] = useState(String(product.productStock));
  const [saving, setSaving] = useState(false);
  const stock = Number(value);
  const valid = value !== "" && Number.isInteger(stock) && stock >= 0;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    const result = await dispatch(updateAdminProductStock(product.id, stock));
    setSaving(false);
    if (result?.success) {
      dispatch(syncDashboard()).catch(() => {});
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <form onSubmit={save} className="w-full max-w-xs rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
        <h2 className={`font-bold ${strong}`}>Stock for {product.productName}</h2>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button type="button" onClick={() => setValue(String(Math.max(0, (Number(value) || 0) - 1)))} className={secondaryButton} aria-label="One less"><Minus className="h-4 w-4" /></button>
          <input type="number" min={0} step={1} value={value} onChange={(e) => setValue(e.target.value)} aria-label="Units in stock" className={`${control} w-24 text-center text-lg font-semibold`} autoFocus />
          <button type="button" onClick={() => setValue(String((Number(value) || 0) + 1))} className={secondaryButton} aria-label="One more"><Plus className="h-4 w-4" /></button>
        </div>
        {product.productStock <= 0 && stock > 0 && (
          <p className={`mt-3 text-center text-xs ${muted}`}>Shoppers waiting for it will be told it's back in stock.</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={secondaryButton}>Cancel</button>
          <button type="submit" disabled={!valid || saving || stock === product.productStock} className={primaryButton}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>
  );
};

const ProductManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, status, actionLoading, error } = useAppSelector((state) => state.adminProduct);
  const categories = useAppSelector((state) => state.adminCategory.categories);
  const { lowStockThreshold } = useStoreSettings();
  const lowLimit = Math.max(1, Number(lowStockThreshold) || 5);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep links: ?search=, ?category= (id or name), ?stock=LOW_STOCK|OUT_OF_STOCK|IN_STOCK|ALERT
  const linkedStock = (() => {
    const raw = (searchParams.get("stock") || searchParams.get("stockFilter") || "").toUpperCase();
    if (["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "ALERT"].includes(raw)) return raw as StockFilter;
    const q = (searchParams.get("search") || "").toLowerCase();
    if (q === "low stock") return "LOW_STOCK";
    if (q === "out of stock" || q === "sold out") return "OUT_OF_STOCK";
    return "ALL";
  })();
  const linkedSearch = ["low stock", "out of stock", "sold out"].includes((searchParams.get("search") || "").toLowerCase())
    ? ""
    : searchParams.get("search") || "";

  const [search, setSearch] = useState(linkedSearch);
  const [category, setCategory] = useState(searchParams.get("category") || searchParams.get("categoryId") || "ALL");
  const [stockFilter, setStockFilter] = useState<StockFilter>(linkedStock);
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [viewing, setViewing] = useState<AdminProduct | null>(null);
  const [stockFor, setStockFor] = useState<AdminProduct | null>(null);
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dispatch(fetchAdminProducts());
    dispatch(fetchAdminCategories());

    // Orders change stock: reload (once per burst of events)
    const socket = connectSocket();
    const refresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => dispatch(fetchAdminProducts()), 800);
    };
    const events = ["admin:low-stock", "admin:out-of-stock", "admin:order-created", "admin:order-cancelled", "admin:dashboard-refresh"];
    events.forEach((event) => socket.on(event, refresh));
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      events.forEach((event) => socket.off(event, refresh));
    };
  }, [dispatch]);

  // A ?category= link may use the category's name; match it once categories are loaded
  const categoryId = useMemo(() => {
    if (category === "ALL") return "ALL";
    const match = categories.find((c) => c.id === category || c.categoryName.toLowerCase() === category.toLowerCase());
    return match ? match.id : category;
  }, [category, categories]);

  const changeCategory = (id: string) => {
    setCategory(id);
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("categoryId");
      if (id === "ALL") next.delete("category");
      else next.set("category", id);
      return next;
    }, { replace: true });
  };

  const syncElsewhere = () => {
    dispatch(syncDashboard()).catch(() => {});
    dispatch(fetchAdminCategories()); // product counts per category
  };

  const save = async (data: FormData) => {
    const result = editing && editing !== "new"
      ? await dispatch(updateAdminProduct(editing.id, data))
      : await dispatch(addAdminProduct(data));
    if (result?.success) {
      setEditing(null);
      if (viewing && result.data) setViewing(result.data);
      syncElsewhere();
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const result = await dispatch(deleteAdminProduct(toDelete.id));
    if (result?.success) {
      if (viewing?.id === toDelete.id) setViewing(null);
      syncElsewhere();
    }
    setToDelete(null);
  };

  // Keep the side panel showing the latest copy (e.g. after a stock change)
  const viewingLive = viewing ? products.find((p) => p.id === viewing.id) ?? viewing : null;

  const isLow = (p: AdminProduct) => p.productStock > 0 && p.productStock <= lowLimit;
  const inStock = products.filter((p) => p.productStock > 0).length;
  const alerts = products.filter((p) => p.productStock <= lowLimit).length;
  const stockValue = products.reduce((sum, p) => sum + p.productPrice * Math.max(0, p.productStock), 0);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (categoryId !== "ALL" && p.categoryId !== categoryId) return false;
      if (stockFilter === "IN_STOCK" && p.productStock <= 0) return false;
      if (stockFilter === "LOW_STOCK" && !isLow(p)) return false;
      if (stockFilter === "OUT_OF_STOCK" && p.productStock > 0) return false;
      if (stockFilter === "ALERT" && p.productStock > lowLimit) return false;
      if (q && !p.productName.toLowerCase().includes(q) && !categoryOf(p).toLowerCase().includes(q)) return false;
      return true;
    });
    const sorters: Record<Sort, (a: AdminProduct, b: AdminProduct) => number> = {
      newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      name: (a, b) => a.productName.localeCompare(b.productName),
      price_asc: (a, b) => a.productPrice - b.productPrice,
      price_desc: (a, b) => b.productPrice - a.productPrice,
      stock_asc: (a, b) => a.productStock - b.productStock,
    };
    return list.sort(sorters[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isLow only depends on lowLimit
  }, [products, categoryId, stockFilter, search, sort, lowLimit]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstLoad = (status === Status.IDLE || status === Status.LOADING) && products.length === 0;
  const filtered = search.trim() !== "" || categoryId !== "ALL" || stockFilter !== "ALL";

  const stats = [
    { label: "Products", value: products.length.toLocaleString(), hint: `in ${categories.length} categories`, icon: Package, tone: "bg-[#E6540B]/10 text-[#E6540B] dark:bg-[#E6540B]/15", filter: "ALL" as StockFilter },
    { label: "In stock", value: inStock.toLocaleString(), hint: "Show only these", icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", filter: "IN_STOCK" as StockFilter },
    { label: "Low or out of stock", value: alerts.toLocaleString(), hint: `${lowLimit} or fewer left`, icon: AlertTriangle, tone: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", filter: "ALERT" as StockFilter },
    { label: "Stock value", value: rs(stockValue), hint: "At selling prices", icon: TrendingUp, tone: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400", filter: null },
  ];

  const actions = (p: AdminProduct) => (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" onClick={() => setViewing(p)} className={iconButton} aria-label={`View ${p.productName}`} title="Details and orders"><Eye className="h-4 w-4" /></button>
      <button type="button" onClick={() => setEditing(p)} className={iconButton} aria-label={`Edit ${p.productName}`} title="Edit"><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={() => setToDelete(p)} className={`${iconButton} hover:text-red-700 dark:hover:text-red-400`} aria-label={`Delete ${p.productName}`} title="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  );

  const thumb = (p: AdminProduct, size = "h-11 w-11") => (
    <span className={`relative shrink-0 overflow-hidden rounded-lg bg-[#F4EEDF] dark:bg-white/5 ${size}`}>
      <img src={optimizeImageUrl(p.productImage, 120)} alt="" loading="lazy" onError={hideBrokenImage} className="h-full w-full object-cover" />
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold sm:text-3xl ${strong}`}>Products</h1>
          <p className={`mt-1 text-sm ${muted}`}>Prices, stock and details of everything in your store.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => dispatch(fetchAdminProducts())} disabled={status === Status.LOADING} className={secondaryButton}>
            <RefreshCw className={`h-4 w-4 ${status === Status.LOADING ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button type="button" onClick={() => setEditing("new")} disabled={categories.length === 0 && !firstLoad} className={primaryButton} title={categories.length === 0 ? "Create a category first" : undefined}>
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const active = stat.filter !== null && stat.filter !== "ALL" && stockFilter === stat.filter;
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-sm ${muted}`}>{stat.label}</p>
                  {firstLoad ? <Skeleton className="mt-1 h-7 w-16" /> : <p className={`mt-1 truncate text-xl font-bold sm:text-2xl ${strong}`}>{stat.value}</p>}
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}><Icon className="h-4 w-4" /></span>
              </div>
              <p className={`mt-1 text-xs ${muted}`}>{active ? "Showing these · click to show all" : stat.hint}</p>
            </>
          );
          return stat.filter === null ? (
            <div key={stat.label} className={`${card} p-4`}>{body}</div>
          ) : (
            <button
              key={stat.label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setStockFilter(active || stat.filter === "ALL" ? "ALL" : stat.filter!);
                setPage(1);
              }}
              className={`${card} cursor-pointer p-4 text-left transition hover:border-[#1A1613]/25 dark:hover:border-white/25 ${active ? "!border-[#E6540B] ring-2 ring-[#E6540B]/15" : ""}`}
            >
              {body}
            </button>
          );
        })}
      </div>

      <section className={card}>
        <div className="flex flex-col gap-2 border-b border-[#1A1613]/10 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-white/10">
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1613]/40 dark:text-[#F5EFE6]/40" />
            <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products" aria-label="Search products" className={`${control} w-full pl-9`} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select value={categoryId} onChange={(e) => changeCategory(e.target.value)} aria-label="Category" className={`${control} cursor-pointer`}>
              <option value="ALL">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
            <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value as StockFilter); setPage(1); }} aria-label="Stock" className={`${control} cursor-pointer`}>
              <option value="ALL">Any stock</option>
              <option value="IN_STOCK">In stock</option>
              <option value="LOW_STOCK">Low stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
              <option value="ALERT">Low or out of stock</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" className={`${control} col-span-2 cursor-pointer sm:col-span-1`}>
              <option value="newest">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="stock_asc">Stock: lowest first</option>
            </select>
          </div>
        </div>

        {firstLoad ? (
          <div className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-24" /></div>
              </div>
            ))}
          </div>
        ) : status === Status.ERROR && products.length === 0 ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            {error || "Couldn't load products."}{" "}
            <button type="button" onClick={() => dispatch(fetchAdminProducts())} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">Try again</button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <p className={`font-semibold ${strong}`}>No products yet</p>
            <p className={`mt-1 text-sm ${muted}`}>{categories.length ? "Add your first product to start selling." : "Create a category first, then add products to it."}</p>
            {categories.length > 0 ? (
              <button type="button" onClick={() => setEditing("new")} className={`${primaryButton} mt-4`}><Plus className="h-4 w-4" /> Add product</button>
            ) : (
              <Link to="/admin-dashboard/categories" className={`${primaryButton} mt-4`}>Go to categories</Link>
            )}
          </div>
        ) : visible.length === 0 ? (
          <div className={`p-10 text-center text-sm ${muted}`}>
            No products match.{" "}
            {filtered && (
              <button type="button" onClick={() => { setSearch(""); changeCategory("ALL"); setStockFilter("ALL"); }} className="cursor-pointer font-semibold text-[#E6540B] hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Phones */}
            <ul className="divide-y divide-[#1A1613]/8 md:hidden dark:divide-white/10">
              {pageItems.map((p) => (
                <li key={p.id} className="flex gap-3 p-4">
                  <button type="button" onClick={() => setViewing(p)} className="shrink-0 cursor-pointer" aria-label={`View ${p.productName}`}>{thumb(p, "h-16 w-16")}</button>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-semibold ${strong}`}>{p.productName}</p>
                    <p className={`text-xs ${muted}`}>{categoryOf(p)}</p>
                    <div className="mt-1 text-sm"><Price product={p} /></div>
                    <button type="button" onClick={() => setStockFor(p)} className="mt-1 cursor-pointer" title="Change stock"><StockBadge stock={p.productStock} low={lowLimit} /></button>
                  </div>
                  {actions(p)}
                </li>
              ))}
            </ul>

            {/* Larger screens */}
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className={`border-b border-[#1A1613]/10 text-left text-xs font-semibold dark:border-white/10 ${muted}`}>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Added</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1613]/8 dark:divide-white/10">
                {pageItems.map((p) => {
                  const reviews = p.reviews?.length || 0;
                  return (
                    <tr key={p.id} className="hover:bg-[#F4EEDF]/40 dark:hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {thumb(p)}
                          <div className="min-w-0">
                            <button type="button" onClick={() => setViewing(p)} className={`block max-w-[260px] cursor-pointer truncate text-left font-semibold hover:text-[#E6540B] ${strong}`}>{p.productName}</button>
                            <span className={`text-xs ${muted}`}>{categoryOf(p)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Price product={p} /></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setStockFor(p)} className="cursor-pointer" title="Change stock"><StockBadge stock={p.productStock} low={lowLimit} /></button>
                      </td>
                      <td className={`px-4 py-3 ${muted}`}>
                        {reviews > 0 ? (
                          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" strokeWidth={0} /><span className={strong}>{ratingOf(p).toFixed(1)}</span> ({reviews})</span>
                        ) : "—"}
                      </td>
                      <td className={`hidden px-4 py-3 lg:table-cell ${muted}`}>{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3">{actions(p)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={`flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1613]/10 px-4 py-3 text-sm dark:border-white/10 ${muted}`}>
              <span>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visible.length)} of {visible.length}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className={secondaryButton}>Previous</button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} className={secondaryButton}>Next</button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {editing && (
        <ProductForm
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          categories={categories}
          saving={actionLoading}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
      {viewingLive && (
        <ProductPanel
          key={viewingLive.id}
          product={viewingLive}
          onClose={() => setViewing(null)}
          onEdit={() => setEditing(viewingLive)}
          onStock={() => setStockFor(viewingLive)}
        />
      )}
      {stockFor && <StockDialog key={stockFor.id} product={stockFor} onClose={() => setStockFor(null)} />}
      {toDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF8] p-5 dark:bg-[#1E1A17]">
            <h2 className={`text-lg font-bold ${strong}`}>Delete {toDelete.productName}?</h2>
            <p className={`mt-2 text-sm ${muted}`}>
              It's removed from the store along with its reviews, and from shoppers' carts and wishlists. Products that are already in
              orders can't be deleted; set their stock to 0 instead.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setToDelete(null)} disabled={actionLoading} className={secondaryButton}>Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={actionLoading} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
