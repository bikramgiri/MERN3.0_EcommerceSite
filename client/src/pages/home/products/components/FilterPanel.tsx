import { useId, useState, type FormEvent } from "react";
import { Star, X } from "lucide-react";

export interface FilterValues {
  category: string; // category id or "all"
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

interface FilterPanelProps {
  values: FilterValues;
  categories: { id: string; name: string; count: number }[];
  onChange: (changes: Partial<FilterValues>) => void;
  onReset: () => void;
  onClose?: () => void; // shown as an X on the mobile sheet
}

const RATING_OPTIONS = [4, 3, 2];

const sectionTitle = "mb-3 text-sm font-semibold text-[#1A1613]";

/** Category, price and rating filters (sidebar on desktop, bottom sheet on mobile) */
export function FilterPanel({ values, categories, onChange, onReset, onClose }: FilterPanelProps) {
  // Unique per instance: the sidebar and the mobile sheet can both be mounted
  const uid = useId();
  // Price inputs apply on submit so the list doesn't jump on every keystroke
  const [minInput, setMinInput] = useState(values.minPrice?.toString() ?? "");
  const [maxInput, setMaxInput] = useState(values.maxPrice?.toString() ?? "");
  const [priceError, setPriceError] = useState("");

  // Keep inputs in sync when filters change elsewhere (chips, reset, back button)
  const [synced, setSynced] = useState({ min: values.minPrice, max: values.maxPrice });
  if (synced.min !== values.minPrice || synced.max !== values.maxPrice) {
    setSynced({ min: values.minPrice, max: values.maxPrice });
    setMinInput(values.minPrice?.toString() ?? "");
    setMaxInput(values.maxPrice?.toString() ?? "");
    setPriceError("");
  }

  const applyPrice = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const min = minInput === "" ? undefined : Number(minInput);
    const max = maxInput === "" ? undefined : Number(maxInput);
    if ((min !== undefined && min < 0) || (max !== undefined && max < 0)) {
      setPriceError("Prices can't be negative");
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError("Min price can't be more than max price");
      return;
    }
    setPriceError("");
    onChange({ minPrice: min, maxPrice: max });
  };

  const categoryButton = (active: boolean) =>
    `flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
      active
        ? "bg-[#E6540B]/10 font-semibold text-[#E6540B]"
        : "text-[#1A1613]/80 hover:bg-[#F4EEDF]"
    }`;

  const total = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-6 text-[#1A1613]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer rounded-md px-2 py-1 text-sm text-[#1A1613]/60 hover:text-[#E6540B]"
          >
            Clear all
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="cursor-pointer rounded-lg p-1.5 hover:bg-[#F4EEDF]"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <section>
        <h3 className={sectionTitle}>Category</h3>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => onChange({ category: "all" })}
            className={categoryButton(values.category === "all")}
          >
            All categories
            <span className="text-xs text-[#1A1613]/50">{total}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange({ category: cat.id })}
              className={categoryButton(values.category === cat.id)}
            >
              <span className="truncate">{cat.name}</span>
              <span className="text-xs text-[#1A1613]/50">{cat.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-[#1A1613]/10 pt-6">
        <h3 className={sectionTitle}>Price (Rs)</h3>
        <form onSubmit={applyPrice} className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`${uid}-min`}>
              Minimum price
            </label>
            <input
              id={`${uid}-min`}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="w-full rounded-lg border border-[#1A1613]/20 bg-white px-3 py-2 text-sm focus:border-[#E6540B] focus:outline-none focus:ring-1 focus:ring-[#E6540B]"
            />
            <span className="text-[#1A1613]/40">–</span>
            <label className="sr-only" htmlFor={`${uid}-max`}>
              Maximum price
            </label>
            <input
              id={`${uid}-max`}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="w-full rounded-lg border border-[#1A1613]/20 bg-white px-3 py-2 text-sm focus:border-[#E6540B] focus:outline-none focus:ring-1 focus:ring-[#E6540B]"
            />
          </div>
          {priceError && <p className="text-xs text-red-600">{priceError}</p>}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg border border-[#1A1613]/20 px-3 py-2 text-sm font-semibold transition hover:border-[#E6540B] hover:text-[#E6540B]"
          >
            Apply price
          </button>
        </form>
      </section>

      <section className="border-t border-[#1A1613]/10 pt-6">
        <h3 className={sectionTitle}>Customer rating</h3>
        <div className="space-y-1">
          {RATING_OPTIONS.map((stars) => (
            <label
              key={stars}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm hover:text-[#E6540B]"
            >
              <input
                type="radio"
                name={`${uid}-rating`}
                checked={values.minRating === stars}
                onChange={() => onChange({ minRating: stars })}
                className="h-4 w-4 cursor-pointer accent-[#E6540B]"
              />
              <span className="flex items-center gap-1">
                {stars}
                <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" strokeWidth={0} />
                & up
              </span>
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm hover:text-[#E6540B]">
            <input
              type="radio"
              name={`${uid}-rating`}
              checked={!values.minRating}
              onChange={() => onChange({ minRating: undefined })}
              className="h-4 w-4 cursor-pointer accent-[#E6540B]"
            />
            Any rating
          </label>
        </div>
      </section>
    </div>
  );
}
