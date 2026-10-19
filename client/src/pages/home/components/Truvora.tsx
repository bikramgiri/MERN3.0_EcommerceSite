import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Truvora() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-[#1A1613] px-6 py-10 text-center sm:px-10 md:flex-row md:justify-between md:text-left">
        <div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Can't find what you're looking for?
          </h2>
          <p className="mt-2 text-white/70">
            Browse the full catalogue and filter by category, price and rating.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#E6540B] px-6 py-3 font-semibold text-white transition hover:bg-[#c94806]"
        >
          Browse all products
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
