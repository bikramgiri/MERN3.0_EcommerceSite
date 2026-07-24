import { ArrowRight, Leaf, RotateCcw, Star, Truck } from "lucide-react";

const stats = [
  { icon: Truck, label: "12,000+ pieces shipped" },
  { icon: Star, label: "48 independent makers" },
  { icon: RotateCcw, label: "30-day returns, no questions" },
  { icon: Leaf, label: "Carbon-neutral shipping" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-['IBM_Plex_Mono',monospace] text-xs tracking-[0.25em] uppercase text-[#E6540B]">
      {children}
    </p>
  );
}

export default function Hero() {
  return (
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

      <section className="relative overflow-hidden bg-[#FAF3E4] text-[#1A1613]">
        <div
          className="pointer-events-none absolute -right-40 top-0 h-[600px] w-[600px] rounded-full opacity-[0.08] blur-3xl"
          style={{
            background: "radial-gradient(circle, #E6540B 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-[1500px] gap-14 px-6 py-20 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-20">
          <div className="mx-auto max-w-md lg:mx-0 lg:max-w-lg">
            <SectionLabel>
              Curated collections • Endless possibilities
            </SectionLabel>

            <h1 className="mt-5 font-['Fraunces',serif] text-4xl leading-[1.08] text-[#1A1613] sm:text-5xl lg:text-6xl">
              Find everything,
              <br />
              in <span className="italic text-[#E6540B]">one place.</span>
            </h1>

            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#1A1613]/65">
              From everyday essentials to trending favorites, discover quality
              products across every category - carefully selected to make
              shopping simple, fast, and enjoyable.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#bestsellers"
                className="group inline-flex items-center gap-2 bg-[#E6540B] px-6 py-3 text-sm font-medium text-[#FDF8ED] transition hover:bg-[#c94806] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6540B]"
              >
                Shop bestsellers
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </a>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 border border-[#1A1613]/20 px-6 py-3 text-sm font-medium text-[#1A1613] transition hover:border-[#1A1613]/50 hover:bg-[#1A1613]/5"
              >
                Browse all categories
              </a>
            </div>

            {/* Trust row */}
            <div className="mt-8 flex items-center gap-3 text-sm text-[#1A1613]/55">
              <div className="flex text-[#E6540B]">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
              <span>4.8/5 from 2,300+ shoppers</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-sm border border-[#1A1613]/10 shadow-lg shadow-[#1A1613]/10">
                <img
                  src="../../../../imgs/Screenshot 2026-03-12 135258.png"
                  alt="Wireless earbuds and a smart device styled on a desk"
                  className="h-64 w-full object-cover transition duration-500 hover:scale-105 sm:h-72"
                />
              </div>
              <div className="mt-8 overflow-hidden rounded-sm border border-[#1A1613]/10 shadow-lg shadow-[#1A1613]/10">
                <img
                  src="../../../../imgs/Screenshot 2026-03-12 134511.png"
                  alt="Folded knitwear and accessories"
                  className="h-64 w-full object-cover transition duration-500 hover:scale-105 sm:h-72"
                />
              </div>
              <div className="overflow-hidden rounded-sm border border-[#1A1613]/10 shadow-lg shadow-[#1A1613]/10">
                <img
                  src="../../../../imgs/Screenshot 2026-03-12 134823.png"
                  alt="Skincare bottles arranged on a tray"
                  className="h-48 w-full object-cover transition duration-500 hover:scale-105 sm:h-56"
                />
              </div>
              <div className="mt-8 overflow-hidden rounded-sm border border-[#1A1613]/10 shadow-lg shadow-[#1A1613]/10">
                <img
                  src="../../../../imgs/Screenshot 2026-03-12 135344.png"
                  alt="Coffee bags and pantry staples"
                  className="h-48 w-full object-cover transition duration-500 hover:scale-105 sm:h-56"
                />
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 rounded-sm bg-[#1A1613] px-4 py-2.5 text-[#FDF8ED] shadow-xl sm:-right-8">
              <p className="font-['Fraunces',serif] text-lg font-semibold">
                50k+
              </p>
              <p className="text-[11px] text-[#FDF8ED]/60">happy shoppers</p>
            </div>
          </div>
        </div>

      <section className="border-y border-[#1A1613]/10 bg-[#F4EEDF]">
  <div className="mx-auto max-w-[1500px] px-6 lg:px-10">
    <div className="grid grid-cols-2 divide-x divide-y divide-[#1A1613]/10 sm:grid-cols-4 sm:divide-y-0">
      {stats.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="group flex flex-col items-start gap-3 px-6 py-8 transition-colors hover:bg-[#EDE5D0] sm:px-8"
        >
          {/* Icon in a warm pill */}
          <span className="inline-flex items-center justify-center rounded-sm bg-[#E6540B]/10 p-2.5 transition-colors group-hover:bg-[#E6540B]/18">
            <Icon
              size={18}
              strokeWidth={1.6}
              className="text-[#E6540B]"
            />
          </span>

          {/* Stat number pulled from label, shown large */}
          <div>
            <p className="font-['Fraunces',serif] text-2xl font-semibold leading-none text-[#1A1613]">
              {label.match(/[\d,k+]+/i)?.[0] ?? "✓"}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-snug tracking-wide text-[#1A1613]/60 font-['IBM_Plex_Mono',monospace] uppercase">
              {label.replace(/^[\d,k+\s]+/i, "")}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
      </section>
    </div>
  );
}
