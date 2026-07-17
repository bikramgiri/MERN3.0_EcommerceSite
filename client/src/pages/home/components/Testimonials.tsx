import {
  Star
} from "lucide-react";

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-['IBM_Plex_Mono',monospace] text-xl tracking-[0.25em] uppercase text-[#E6540B]">
      {children}
    </p>
  );
}

export default function Testimonials() {
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

      <section className="border-t border-[#1A1613]/10 bg-[#F4EEDF] py-20">
        <div className="mx-auto max-w-[1500px] px-6 lg:px-10">
          <SectionLabel>From our customers</SectionLabel>
          <h2 className="mt-3 font-['Fraunces',serif] text-3xl sm:text-4xl">
            One cart, every category, no regrets
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col justify-between bg-[#FDF8ED] p-7 shadow-[0_2px_10px_rgba(26,22,19,0.04)] transition hover:shadow-[0_8px_24px_rgba(26,22,19,0.08)]"
              >
                <div className="flex gap-1 text-[#E6540B]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill="currentColor"
                      strokeWidth={0}
                    />
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
    </div>
  );
}
