import {
  ArrowRight,
  Star,
  Truck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const categories = [
  { name: "Electronics", count: 142, seed: "truvora-electronics" },
  { name: "Fashion & Apparel", count: 218, seed: "truvora-fashion" },
  { name: "Beauty & Cosmetics", count: 96, seed: "truvora-beauty" },
  { name: "Stationery & Office", count: 73, seed: "truvora-stationery" },
  { name: "Food & Grocery", count: 154, seed: "truvora-food" },
];

const products = [
  {
    name: "Wireless Noise-Cancelling Earbuds",
    maker: "Volt Audio",
    price: "$89",
    tag: "BESTSELLER",
    seed: "truvora-e01",
  },
  {
    name: "Oversized Cotton Knit Sweater",
    maker: "Fernweh Studio",
    price: "$64",
    tag: "NEW",
    seed: "truvora-f01",
  },
  {
    name: "Vitamin C Brightening Serum",
    maker: "Lumen Skin Co.",
    price: "$38",
    tag: "−20%",
    seed: "truvora-b01",
  },
  {
    name: "Leather-Bound Dot Grid Journal",
    maker: "Fen & Ink",
    price: "$29",
    tag: null,
    seed: "truvora-s01",
  },
  {
    name: "Single-Origin Coffee, 3-Pack",
    maker: "Ridgeline Roasters",
    price: "$34",
    tag: "BESTSELLER",
    seed: "truvora-fd01",
  },
  {
    name: "Smart Fitness Tracker Band",
    maker: "Volt Audio",
    price: "$112",
    tag: "NEW",
    seed: "truvora-e02",
  },
];

const testimonials = [
  {
    quote:
      "I bought earbuds, a journal, and skincare in one order and every single thing overdelivered on quality.",
    name: "Priya N.",
    role: "Repeat customer since 2023",
  },
  {
    quote:
      "Fast shipping, real reviews, no dropshipping nonsense. Finally a marketplace that curates instead of just listing everything.",
    name: "Marcus D.",
    role: "Verified buyer",
  },
  {
    quote:
      "Returned a sweater that ran small. Four minutes, no argument, refund landed same day.",
    name: "Elin K.",
    role: "Verified buyer",
  },
];

const stats = [
  { icon: Truck, label: "Free shipping over $75" },
  { icon: ShieldCheck, label: "Buyer protection on every order" },
  { icon: RotateCcw, label: "30-day returns, no questions" },
  { icon: Sparkles, label: "New arrivals every week" },
];

function TagBadge({
  label,
  sub,
  rotate = -6,
  className = "",
}: {
  label: string;
  sub?: string;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="relative bg-[#FDF8ED] text-[#1A1613] pl-6 pr-4 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.28)] [clip-path:polygon(16%_0,100%_0,100%_100%,16%_100%,0_50%)]">
        <span className="absolute left-[19%] top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A1613]/10 ring-1 ring-[#1A1613]/30" />
        <p className="font-['IBM_Plex_Mono',monospace] text-[10px] tracking-widest uppercase text-[#8A3B12]">
          {label}
        </p>
        {sub && (
          <p className="font-['IBM_Plex_Mono',monospace] text-sm font-medium leading-tight">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-['IBM_Plex_Mono',monospace] text-xs tracking-[0.25em] uppercase text-[#E6540B]">
      {children}
    </p>
  );
}

export default function Landing() {

  return (
      <>
    <div className="min-h-screen bg-[#FDF8ED] text-[#1A1613] font-['Inter',sans-serif] antialiased">
      <style>{`
        @keyframes truvora-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .truvora-marquee-track {
          animation: truvora-marquee 22s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .truvora-marquee-track { animation: none; }
        }
      `}</style>

      <section className="bg-[#1A1613] text-[#FDF8ED]">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-28">
          <div>
            <SectionLabel>Everything you actually need · one cart</SectionLabel>
            <h1 className="mt-5 font-['Fraunces',serif] text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Shop it all,
              <br />
              skip the{" "}
              <span className="italic text-[#E6540B]">clutter.</span>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#FDF8ED]/70">
              Electronics, fashion, beauty, stationery, groceries — Truvora
              curates the best of every category so you're never scrolling
              through junk to find the good stuff.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#bestsellers"
                className="group inline-flex items-center gap-2 bg-[#E6540B] px-6 py-3 text-sm font-medium text-[#FDF8ED] transition hover:bg-[#c94806]"
              >
                Shop bestsellers
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </a>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 border border-[#FDF8ED]/25 px-6 py-3 text-sm font-medium transition hover:border-[#FDF8ED]/60"
              >
                Browse all categories
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-sm">
                <img
                  // src="https://picsum.photos/seed/truvora-hero-electronics/500/560"
                  src="../../../../imgs/Screenshot 2026-03-12 135258.png"
                  alt="Wireless earbuds and a smart device styled on a desk"
                  className="h-64 w-full object-cover sm:h-72"
                />
              </div>
              <div className="mt-8 overflow-hidden rounded-sm">
                <img
                  // src="https://picsum.photos/seed/truvora-hero-fashion/500/560"
                  src="../../../../imgs/Screenshot 2026-03-12 134511.png"
                  alt="Folded knitwear and accessories"
                  className="h-64 w-full object-cover sm:h-72"
                />
              </div>
              <div className="overflow-hidden rounded-sm">
                <img
                  // src="https://picsum.photos/seed/truvora-hero-beauty/500/460"
                  src="../../../../imgs/Screenshot 2026-03-12 134823.png"
                  alt="Skincare bottles arranged on a tray"
                  className="h-48 w-full object-cover sm:h-56"
                />
              </div>
              <div className="mt-8 overflow-hidden rounded-sm">
                <img
                  // src="https://picsum.photos/seed/truvora-hero-food/500/460"
                  src="../../../../imgs/Screenshot 2026-03-12 135344.png"
                  alt="Coffee bags and pantry staples"
                  className="h-48 w-full object-cover sm:h-56"
                />
              </div>
            </div>
            <TagBadge
              label="Bestseller"
              sub="$89"
              rotate={-7}
              className="absolute -left-6 top-6 sm:-left-10"
            />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-[#1A1613]/10 bg-[#FDF8ED]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4 lg:px-10">
          {stats.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon
                size={20}
                strokeWidth={1.6}
                className="shrink-0 text-[#E6540B]"
              />
              <span className="text-[13px] leading-tight text-[#1A1613]/75">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <SectionLabel>Shop by category</SectionLabel>
            <h2 className="mt-3 font-['Fraunces',serif] text-3xl sm:text-4xl">
              Five aisles. Zero filler.
            </h2>
          </div>
          <a
            href="#"
            className="hidden shrink-0 items-center gap-2 text-sm font-medium text-[#E6540B] hover:underline sm:flex"
          >
            View all categories <ArrowRight size={15} />
          </a>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className="group relative overflow-hidden rounded-sm"
            >
              <img
                src={`https://picsum.photos/seed/${cat.seed}/500/620`}
                alt={cat.name}
                className="h-64 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1613]/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="font-['Fraunces',serif] text-lg text-[#FDF8ED]">
                  {cat.name}
                </p>
                <p className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#FDF8ED]/70">
                  {cat.count} items
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section
        id="bestsellers"
        className="border-y border-[#1A1613]/10 bg-[#F4EEDF] py-20"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <SectionLabel>This week's picks</SectionLabel>
              <h2 className="mt-3 font-['Fraunces',serif] text-3xl sm:text-4xl">
                Bestsellers across every aisle
              </h2>
            </div>
          </div>

          <div className="mt-10 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
            {products.map((p) => (
              <div
                key={p.name}
                className="group relative w-64 shrink-0 snap-start sm:w-72"
              >
                <div className="relative overflow-hidden rounded-sm bg-[#FDF8ED]">
                  <img
                    src={`https://picsum.photos/seed/${p.seed}/500/560`}
                    alt={p.name}
                    className="h-64 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-72"
                  />
                  {p.tag && (
                    <TagBadge
                      label={p.tag}
                      rotate={-8}
                      className="absolute -left-3 -top-3"
                    />
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-medium leading-snug">
                      {p.name}
                    </p>
                    <p className="mt-1 text-[12px] text-[#1A1613]/50">
                      {p.maker}
                    </p>
                  </div>
                  <p className="font-['IBM_Plex_Mono',monospace] text-sm font-medium text-[#8A3B12]">
                    {p.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div className="overflow-hidden rounded-sm">
            <img
              src="https://picsum.photos/seed/truvora-warehouse/700/560"
              alt="A quality-control check on packaged products before shipping"
              className="h-72 w-full object-cover sm:h-96"
            />
          </div>
          <div>
            <SectionLabel>Why Truvora</SectionLabel>
            <h2 className="mt-3 font-['Fraunces',serif] text-3xl leading-tight sm:text-4xl">
              We vet it before you buy it
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#1A1613]/70">
              Every seller on Truvora goes through a quality review before
              their first listing ever goes live — across electronics,
              fashion, beauty, stationery, and food alike. No counterfeit
              tech, no expired skincare, no mystery sellers.
            </p>
            <blockquote className="mt-8 border-l-2 border-[#E6540B] pl-5 font-['Fraunces',serif] text-xl italic leading-snug text-[#1A1613]/90">
              "If we wouldn't buy it for ourselves, it doesn't go on the
              site."
            </blockquote>
            <p className="mt-3 font-['IBM_Plex_Mono',monospace] text-[11px] uppercase tracking-widest text-[#1A1613]/50">
              — Amara Lin, Founder
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-[#1A1613]/10 bg-[#F4EEDF] py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionLabel>From our customers</SectionLabel>
          <h2 className="mt-3 font-['Fraunces',serif] text-3xl sm:text-4xl">
            One cart, every category, no regrets
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col justify-between bg-[#FDF8ED] p-7"
              >
                <div className="flex gap-1 text-[#E6540B]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="mt-4 font-['Fraunces',serif] text-lg italic leading-snug text-[#1A1613]/90">
                  "{t.quote}"
                </p>
                <div className="mt-6">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-[12px] text-[#1A1613]/50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-[#1A1613] text-[#FDF8ED]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-10">
          <h2 className="font-['Fraunces',serif] text-3xl sm:text-4xl">
            Your next favorite thing is one scroll away.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-[#FDF8ED]/70">
            Join thousands who stopped juggling five different apps and
            started shopping everything in one place.
          </p>
          <a
            href="#bestsellers"
            className="group mt-8 inline-flex items-center gap-2 bg-[#E6540B] px-7 py-3 text-sm font-medium text-[#FDF8ED] transition hover:bg-[#c94806]"
          >
            Start shopping
            <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>
    </div>
    </>
  );
}