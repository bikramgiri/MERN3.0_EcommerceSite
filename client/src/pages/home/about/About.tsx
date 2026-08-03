import { useEffect, useState } from "react";
import {
  Sparkles,
  Heart,
  ShieldCheck,
  Truck,
  Users,
  Star,
  ArrowRight,
  Gem,
  Shirt,
  Apple,
  Lamp,
  Dumbbell,
  Laptop,
} from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { label: "Electronics & Gadgets", icon: Laptop, tone: "bg-[#1A1613]" },
  { label: "Fashion & Apparel", icon: Shirt, tone: "bg-[#9B3A2E]" },
  { label: "Food & Grocery", icon: Apple, tone: "bg-[#8A3B12]" },
  { label: "Home & Lifestyle", icon: Lamp, tone: "bg-[#E6540B]" },
  { label: "Stationery & Sports", icon: Dumbbell, tone: "bg-[#9B3A2E]" },
  { label: "Beauty & Cosmetics", icon: Gem, tone: "bg-[#1A1613]" },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Vetted, not just listed",
    body: "Every seller and product on Truvora is reviewed before it goes live, so you're never guessing whether something is worth your cart.",
  },
  {
    icon: Truck,
    title: "Fast, honest delivery",
    body: "Real-time order tracking and straightforward shipping timelines — no surprise delays hidden behind a spinner.",
  },
  {
    icon: Heart,
    title: "Made for everyday shopping",
    body: "From a phone charger to a festival outfit, Truvora is built to be the one tab you keep open, not a single-category app.",
  },
  {
    icon: Users,
    title: "Independent sellers, real people",
    body: "Behind every listing is a small business or maker. When you buy on Truvora, you're backing someone building something of their own.",
  },
];

const stats = [
  { value: "6", unit: "categories", label: "and counting" },
  { value: "50K+", unit: "shoppers", label: "across Nepal" },
  { value: "4.8", unit: "/ 5", label: "average rating" },
  { value: "24/7", unit: "support", label: "real humans" },
];

export default function About() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 500);
  }, []);

  return (
    <div className="bg-[#FDF8ED] text-[#1A1613] font-sans">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-14 items-center">
          <div
            className={`transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <p className="font-mono text-xs md:text-sm tracking-[0.25em] text-[#E6540B] uppercase mb-4">
              About Truvora
            </p>
            <h1 className="font-fraunces text-4xl sm:text-5xl md:text-6xl leading-[1.08] mb-6">
              One store, <br />
              <span className="italic text-[#9B3A2E]">every</span> corner of
              your list.
            </h1>
            <p className="text-base md:text-lg text-[#1A1613]/70 max-w-md mb-8 leading-relaxed">
              Truvora is a marketplace built for how people actually shop —
              electronics on Monday, groceries on Tuesday, a birthday gift by
              Friday. We bring independent sellers and everyday categories
              together under one roof, so you stop juggling five different
              apps for one cart.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-[#E6540B] text-[#FDF8ED] font-medium px-6 py-3 rounded-full hover:bg-[#8A3B12] transition-colors"
              >
                Shop Truvora
                <ArrowRight size={18} />
              </Link>
              <div className="flex items-center gap-2 font-mono text-sm text-[#1A1613]/70">
                <span className="flex text-[#E6540B]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
                4.8/5 from 2,300+ shoppers
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {categories.map(({ label, icon: Icon, tone }, i) => (
              <div
                key={label}
                className={`price-tag ${tone} text-[#FDF8ED] p-5 h-32 flex flex-col justify-between ${
                  i % 2 === 1 ? "translate-y-4" : ""
                }`}
              >
                <span className="w-9 h-9 rounded-full bg-[#FDF8ED]/15 flex items-center justify-center">
                  <Icon size={18} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wide leading-snug">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1A1613] text-[#FDF8ED] py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 md:px-10 text-center">
          <Sparkles className="mx-auto mb-6 text-[#E6540B]" size={28} />
          <p className="font-fraunces text-2xl sm:text-3xl md:text-4xl leading-snug">
            We started Truvora with one question:{" "}
            <span className="italic text-[#E6540B]">
              why does online shopping feel scattered?
            </span>{" "}
            The answer became a single marketplace where quality is checked
            up front, categories don't live in separate silos, and every
            seller is someone you could actually meet.
          </p>
        </div>
      </section>

      <section className="bg-[#FDF8ED] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <p className="font-mono text-xs md:text-sm tracking-[0.25em] text-[#E6540B] uppercase mb-3 text-center">
            Why Truvora
          </p>
          <h2 className="font-fraunces text-3xl md:text-4xl text-center mb-16">
            Built around the way you shop
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-[#F4EEDF] rounded-2xl p-7 hover:-translate-y-1 transition-transform duration-300"
              >
                <span className="inline-flex w-11 h-11 rounded-full bg-[#E6540B]/15 text-[#E6540B] items-center justify-center mb-5">
                  <Icon size={20} />
                </span>
                <h3 className="font-fraunces text-xl mb-2">{title}</h3>
                <p className="text-sm text-[#1A1613]/70 leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F4EEDF] py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {stats.map(({ value, unit, label }) => (
              <div
                key={label}
                className="price-tag bg-[#FDF8ED] px-6 py-8 text-center"
              >
                <p className="font-fraunces text-3xl md:text-4xl text-[#9B3A2E]">
                  {value}
                  <span className="font-mono text-base md:text-lg text-[#1A1613]/60 ml-1">
                    {unit}
                  </span>
                </p>
                <p className="font-mono text-xs uppercase tracking-wide text-[#1A1613]/60 mt-2">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center">
          <h2 className="font-fraunces text-3xl md:text-5xl leading-tight mb-6">
            Find everything, <span className="italic text-[#E6540B]">in one place.</span>
          </h2>
          <p className="text-[#1A1613]/70 mb-9 max-w-xl mx-auto">
            Browse curated picks across electronics, fashion, home,
            groceries, beauty and more — all vetted, all in one cart.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#E6540B] text-[#FDF8ED] font-medium px-8 py-3.5 rounded-full hover:bg-[#8A3B12] transition-colors"
          >
            Browse all categories
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <style>{`
        .price-tag {
          position: relative;
          border-radius: 14px;
          clip-path: polygon(
            22px 0%, 100% 0%, 100% 100%, 22px 100%,
            0% 50%
          );
        }
        .price-tag::before {
          content: "";
          position: absolute;
          left: 9px;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #FDF8ED;
          transform: translateY(-50%);
        }
      `}</style>
    </div>
  );
}
