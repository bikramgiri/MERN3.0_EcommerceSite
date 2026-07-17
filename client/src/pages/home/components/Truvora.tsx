
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-['IBM_Plex_Mono',monospace] text-xl tracking-[0.25em] uppercase text-[#E6540B]">
      {children}
    </p>
  );
}

export default function Truvora() {
  return (
    <div className="bg-[#FDF8ED] text-[#1A1613] font-['Inter',sans-serif] antialiased">
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

      <section className="mx-auto max-w-[1500px] px-6 py-20 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div className="overflow-hidden rounded-sm">
            <img
              src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=700&h=560&q=80"
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
              Every seller on Truvora goes through a quality review before their
              first listing ever goes live — across electronics, fashion,
              beauty, stationery, and food alike. No counterfeit tech, no
              expired skincare, no mystery sellers.
            </p>
            <blockquote className="mt-8 border-l-2 border-[#E6540B] pl-5 font-['Fraunces',serif] text-xl italic leading-snug text-[#1A1613]/90">
              "If we wouldn't buy it for ourselves, it doesn't go on the site."
            </blockquote>
            <p className="mt-3 font-['IBM_Plex_Mono',monospace] text-[11px] uppercase tracking-widest text-[#1A1613]/50">
              — Amara Lin, Founder
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
