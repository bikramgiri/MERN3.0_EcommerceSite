import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Bell,
  Mail,
  MapPin,
  Phone,
  RotateCw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { fetchCategories } from "../../../store/customer/categorySlice";
import { describeDeliveryTime, useStoreSettings } from "../../../services/storeSettingsService";
import { Status } from "../../../global/statuses";
import { Skeleton } from "../../../global/Skeleton";
import { hideBrokenImage, responsiveImage } from "../../../utils/helpers";
import usePageTitle from "../../../hooks/usePageTitle";

const container = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export default function About() {
  usePageTitle("About us");
  const dispatch = useAppDispatch();
  const { categories = [], status } = useAppSelector((state) => state.category);
  const settings = useStoreSettings();
  const {
    storeName,
    supportEmail,
    supportPhone,
    address,
    freeShippingThreshold,
    standardShippingFee,
    enableCod,
    enableOnlinePayment,
  } = settings;
  const deliveryTime = describeDeliveryTime(settings);

  useEffect(() => {
    dispatch(fetchCategories()).catch(() => {});
  }, [dispatch]);

  const realCategories = categories.filter((c) => c.id);
  const productCount = realCategories.reduce((sum, c) => sum + (c.totalProducts ?? 0), 0);
  const categoriesLoading = status === Status.LOADING && realCategories.length === 0;
  const categoriesFailed = status === Status.ERROR && realCategories.length === 0;
  const retryCategories = () => dispatch(fetchCategories()).catch(() => {});

  const paymentText = [
    enableCod && "cash on delivery",
    enableOnlinePayment && "eSewa",
    enableOnlinePayment && "Khalti",
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/, ([^,]*)$/, " or $1");

  // How shopping works, based on what the store actually offers
  const steps = [
    {
      icon: ShoppingBag,
      title: "Browse and add to cart",
      text: "Search or filter by category, price and rating, then add what you like to your cart.",
    },
    {
      icon: Banknote,
      title: "Pay the way you prefer",
      text: paymentText ? `Check out with ${paymentText}.` : "Choose a payment method at checkout.",
    },
    {
      icon: Bell,
      title: "Track your order",
      text: "Follow every order in My orders. Status changes also show up in your notifications.",
    },
    {
      icon: Truck,
      title: "Delivered to your door",
      text: [
        deliveryTime,
        freeShippingThreshold > 0
          ? `Delivery is free on orders over Rs ${freeShippingThreshold.toLocaleString()}, and Rs ${standardShippingFee.toLocaleString()} otherwise.`
          : `Standard delivery costs Rs ${standardShippingFee.toLocaleString()}.`,
      ]
        .filter(Boolean)
        .join(" "),
    },
  ];

  const promises = [
    {
      icon: Star,
      title: "Honest reviews",
      text: "Ratings come from real customer reviews, and we remove reviews that break our rules.",
    },
    // Only describe online payments when they're switched on in Settings
    enableOnlinePayment
      ? {
          icon: ShieldCheck,
          title: "Safe payments",
          text: "Online payments happen on eSewa's and Khalti's own secure pages. We never see your wallet details.",
        }
      : {
          icon: Banknote,
          title: "Pay on delivery",
          text: "Pay in cash when your order arrives, so there's nothing to pay upfront.",
        },
    {
      icon: Mail,
      title: "Your data stays yours",
      text: "We only collect what we need to deliver your orders, and we never sell it.",
      link: { to: "/privacy-policy", label: "Read our privacy policy" },
    },
  ];

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      {/* Intro */}
      <section className={`${container} grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20`}>
        <div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            About {storeName}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[#1A1613]/75">
            {storeName} is an online store for everyday shopping
            {address ? `, based in ${address}` : ""}. Electronics, fashion, groceries, home goods,
            beauty products and more, all in one place and delivered to your door.
          </p>
          <p className="mt-4 leading-relaxed text-[#1A1613]/75">
            We keep things simple: clear prices, honest reviews from real customers, easy payment
            {paymentText ? ` with ${paymentText}` : ""}, and order updates you can follow from
            checkout to delivery.
          </p>

          {categoriesLoading && (
            <div className="mt-8 flex gap-10" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-12" />
                </div>
              ))}
            </div>
          )}

          {productCount > 0 && (
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <dt className="text-sm text-[#1A1613]/60">Products</dt>
                <dd className="text-2xl font-bold">{productCount}</dd>
              </div>
              <div>
                <dt className="text-sm text-[#1A1613]/60">Categories</dt>
                <dd className="text-2xl font-bold">{realCategories.length}</dd>
              </div>
              {freeShippingThreshold > 0 && (
                <div>
                  <dt className="text-sm text-[#1A1613]/60">Free delivery over</dt>
                  <dd className="text-2xl font-bold">Rs {freeShippingThreshold.toLocaleString()}</dd>
                </div>
              )}
            </dl>
          )}

          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#E6540B] px-6 py-3 font-semibold text-white transition hover:bg-[#c94806]"
          >
            Start shopping <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <img
            src="/imgs/hero/fashion.webp"
            alt="Clothes on a rack"
            width={400}
            height={500}
            className="aspect-4/5 w-full rounded-xl object-cover"
          />
          <img
            src="/imgs/hero/home-kitchen.webp"
            alt="Couple cooking together in a kitchen"
            width={400}
            height={500}
            className="mt-8 aspect-4/5 w-full rounded-xl object-cover"
          />
        </div>
      </section>

      {/* What we sell: real categories from the store (hidden if the store has none) */}
      {(categoriesLoading || categoriesFailed || realCategories.length > 0) && (
      <section className="border-y border-[#1A1613]/10 bg-white py-12 lg:py-16">
        <div className={container}>
          <h2 className="text-2xl font-bold sm:text-3xl">What you'll find</h2>
          <p className="mt-2 text-[#1A1613]/70">Browse our categories, all in one cart.</p>

          {categoriesFailed ? (
            <div className="mt-8 rounded-xl border border-[#1A1613]/10 py-10 text-center">
              <p className="text-[#1A1613]/70">We couldn't load categories right now.</p>
              <button
                type="button"
                onClick={retryCategories}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1A1613]/20 px-4 py-2 text-sm font-semibold transition hover:border-[#E6540B] hover:text-[#E6540B]"
              >
                <RotateCw className="h-4 w-4" /> Try again
              </button>
            </div>
          ) : (
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-[#1A1613]/10 p-3">
                    <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              : realCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.id}`}
                    className="group flex items-center gap-4 rounded-xl border border-[#1A1613]/10 p-3 transition hover:border-[#E6540B]/50 hover:shadow-sm"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F4EEDF]">
                      <img
                        {...responsiveImage(cat.categoryImage, [64, 128, 192], "64px")}
                        alt=""
                        loading="lazy"
                        onError={hideBrokenImage}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold group-hover:text-[#E6540B]">{cat.categoryName}</p>
                      <p className="text-sm text-[#1A1613]/60">
                        {cat.totalProducts ?? 0} {cat.totalProducts === 1 ? "product" : "products"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#1A1613]/30 transition group-hover:translate-x-0.5 group-hover:text-[#E6540B]" />
                  </Link>
                ))}
          </div>
          )}
        </div>
      </section>
      )}

      {/* How it works */}
      <section className={`${container} py-12 lg:py-16`}>
        <h2 className="text-2xl font-bold sm:text-3xl">How shopping works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6540B]/10 text-[#E6540B]">
                  <Icon size={20} />
                </span>
                <span className="text-sm font-semibold text-[#1A1613]/50">Step {i + 1}</span>
              </div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#1A1613]/70">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Promises */}
      <section className="bg-[#F4EEDF] py-12 lg:py-16">
        <div className={container}>
          <h2 className="text-2xl font-bold sm:text-3xl">What you can count on</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {promises.map(({ icon: Icon, title, text, link }) => (
              <div key={title} className="rounded-xl bg-white p-6">
                <Icon className="h-6 w-6 text-[#E6540B]" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#1A1613]/70">{text}</p>
                {link && (
                  <Link to={link.to} className="mt-3 inline-block text-sm font-semibold text-[#E6540B] hover:underline">
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className={`${container} py-12 lg:py-16`}>
        <div className="flex flex-col gap-8 rounded-2xl bg-[#1A1613] p-6 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Questions? We're happy to help</h2>
            <p className="mt-2 text-white/70">
              Check our{" "}
              <Link to="/faq" className="font-semibold text-white underline">
                FAQ
              </Link>{" "}
              or get in touch.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {supportEmail && (
              <li>
                <a href={`mailto:${supportEmail}`} className="flex items-center gap-2.5 hover:text-[#E6540B]">
                  <Mail className="h-4 w-4 shrink-0 text-[#E6540B]" /> {supportEmail}
                </a>
              </li>
            )}
            {supportPhone && (
              <li>
                <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="flex items-center gap-2.5 hover:text-[#E6540B]">
                  <Phone className="h-4 w-4 shrink-0 text-[#E6540B]" /> {supportPhone}
                </a>
              </li>
            )}
            {address && (
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#E6540B]" /> {address}
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
