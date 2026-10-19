import { ArrowRight, Banknote, ShieldCheck, Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useStoreSettings } from "../../../services/storeSettingsService";

const heroImages = [
  { src: "/imgs/hero/electronics.webp", alt: "Headphones, phone and smartwatch" },
  { src: "/imgs/hero/stationery.webp", alt: "Books and colour pencils on a desk" },
  { src: "/imgs/hero/fashion.webp", alt: "T-shirts on a clothing rack" },
  { src: "/imgs/hero/home-kitchen.webp", alt: "Couple cooking in a kitchen" },
];

export default function Hero() {
  const { freeShippingThreshold, enableCod, enableOnlinePayment } = useStoreSettings();

  // Only promise what the store currently offers (admin can switch these off in Settings)
  const features = [
    {
      icon: Truck,
      title: freeShippingThreshold > 0 ? "Free delivery" : "Home delivery",
      text:
        freeShippingThreshold > 0
          ? `On orders over Rs ${freeShippingThreshold.toLocaleString()}`
          : "Delivered to your door",
    },
    enableCod && { icon: Banknote, title: "Cash on delivery", text: "Pay when it arrives" },
    enableOnlinePayment && { icon: ShieldCheck, title: "Secure payment", text: "eSewa & Khalti" },
    { icon: Star, title: "Honest reviews", text: "Rated by real shoppers" },
  ].filter((feature) => !!feature);

  return (
    <section className="bg-[#FAF3E4] pt-16 text-[#1A1613]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Everything you need,{" "}
            <span className="text-[#E6540B]">in one place</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-[#1A1613]/70 sm:text-lg lg:mx-0">
            Shop electronics, fashion, beauty, groceries and more at fair
            prices, delivered right to your home.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E6540B] px-6 py-3 font-semibold text-white transition hover:bg-[#c94806]"
            >
              Shop now
              <ArrowRight size={18} />
            </Link>
            <a
              href="#categories"
              className="inline-flex items-center justify-center rounded-lg border border-[#1A1613]/20 bg-white px-6 py-3 font-semibold transition hover:border-[#E6540B] hover:text-[#E6540B]"
            >
              Browse categories
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {heroImages.map((img) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              width={480}
              height={360}
              decoding="async"
              className="aspect-4/3 w-full rounded-xl bg-white object-cover"
            />
          ))}
        </div>
      </div>

      <div className="border-t border-[#1A1613]/10 bg-white">
        <div
          className={`mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:px-8 ${
            features.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6540B]/10 text-[#E6540B]">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-[#1A1613]/60">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
