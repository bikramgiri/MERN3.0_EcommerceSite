import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Mail, Phone, Search, X } from "lucide-react";
import Breadcrumb from "../../../global/Breadcrumb";
import { describeDeliveryTime, useStoreSettings } from "../../../services/storeSettingsService";
import usePageTitle from "../../../hooks/usePageTitle";

interface FaqItem {
  id: string; // used for links like /faq#cancel-order
  question: string;
  keywords: string; // extra words people might search for
  answer: ReactNode;
}

interface FaqGroup {
  id: string;
  title: string;
  items: FaqItem[];
}

const linkClass = "font-medium text-[#E6540B] hover:underline";

const FAQ = () => {
  usePageTitle("FAQ");
  const { hash } = useLocation();
  const [query, setQuery] = useState("");
  const settings = useStoreSettings();
  const {
    supportEmail,
    supportPhone,
    standardShippingFee,
    freeShippingThreshold,
    enableCod,
    enableOnlinePayment,
    returnWindowDays,
  } = settings;
  const deliveryTime = describeDeliveryTime(settings);

  const paymentMethods = [
    enableCod && "cash on delivery",
    enableOnlinePayment && "eSewa",
    enableOnlinePayment && "Khalti",
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/, ([^,]*)$/, " and $1");

  const groups: FaqGroup[] = [
    {
      id: "orders",
      title: "Orders",
      items: [
        {
          id: "place-order",
          question: "How do I place an order?",
          keywords: "buy checkout cart purchase",
          answer: (
            <p>
              Add products to your cart, open the{" "}
              <Link to="/cart" className={linkClass}>cart</Link> and choose Checkout. Enter your
              phone number and shipping address, pick a payment method and place your order. You
              need to be signed in to check out.
            </p>
          ),
        },
        {
          id: "track-order",
          question: "How can I track my order?",
          keywords: "status delivery where is my order notification",
          answer: (
            <p>
              Go to <Link to="/my-orders" className={linkClass}>My orders</Link> to see each
              order's status: Pending, Preparation, In Transit, Delivered or Cancelled. When the
              status changes, you'll also see it in your notifications (the bell at the top).
            </p>
          ),
        },
        {
          id: "cancel-order",
          question: "Can I change or cancel my order?",
          keywords: "edit modify cancel address phone quantity",
          answer: (
            <p>
              Yes, while the order is still <strong>Pending</strong>. Open it from My orders to
              change quantities, your phone number or address, or to cancel it. Once we start
              preparing it, it can't be changed online, so please contact us.
            </p>
          ),
        },
        {
          id: "damaged-item",
          question: "What if an item arrives damaged or wrong?",
          keywords: "broken return refund replace exchange wrong item faulty problem",
          answer:
            returnWindowDays > 0 ? (
              <p>
                Contact us within <strong>{returnWindowDays} {returnWindowDays === 1 ? "day" : "days"}</strong>{" "}
                of delivery with your order number and a photo of the item. If it's damaged, faulty or
                not what you ordered, we'll send a replacement or give you a refund.
              </p>
            ) : (
              <p>
                Contact us with your order number and, if possible, a photo of the item. We'll work
                with you to put it right.
              </p>
            ),
        },
        {
          id: "out-of-stock",
          question: "What if a product is out of stock?",
          keywords: "unavailable sold out stock",
          answer: (
            <p>
              Out-of-stock products are marked on the product card and can't be added to the cart.
              Add them to your wishlist to find them again easily later.
            </p>
          ),
        },
      ],
    },
    {
      id: "payment",
      title: "Payment",
      items: [
        {
          id: "payment-methods",
          question: "Which payment methods do you accept?",
          keywords: "pay esewa khalti cod cash on delivery",
          answer: (
            <p>
              {paymentMethods
                ? `We currently accept ${paymentMethods}.`
                : "Available payment methods are shown at checkout."}{" "}
              The options available right now are always shown at checkout.
            </p>
          ),
        },
        {
          id: "safe-payment",
          question: "Is paying online safe?",
          keywords: "secure security esewa khalti card",
          answer: (
            <p>
              Yes. Online payments are made on eSewa's or Khalti's own secure pages. We never see
              or store your wallet PIN, password or card details.
            </p>
          ),
        },
      ],
    },
    {
      id: "shipping",
      title: "Shipping",
      items: [
        {
          id: "shipping-cost",
          question: "How much does shipping cost?",
          keywords: "delivery fee charge free shipping",
          answer: (
            <p>
              {standardShippingFee > 0 ? (
                <>
                  Standard shipping is Rs {standardShippingFee.toLocaleString()}
                  {freeShippingThreshold > 0 && (
                    <>
                      , and it's <strong>free</strong> on orders of Rs{" "}
                      {freeShippingThreshold.toLocaleString()} or more
                    </>
                  )}
                  .
                </>
              ) : (
                <>Shipping is free on all orders.</>
              )}{" "}
              You'll always see the exact fee at checkout before you pay.
            </p>
          ),
        },
        ...(deliveryTime
          ? [
              {
                id: "delivery-time",
                question: "How long does delivery take?",
                keywords: "delivery time days how long when arrive shipping speed",
                answer: (
                  <p>
                    {deliveryTime} These are estimates. You can follow your order's progress in{" "}
                    <Link to="/my-orders" className={linkClass}>My orders</Link>.
                  </p>
                ),
              },
            ]
          : []),
        {
          id: "delivery-area",
          question: "Where do you deliver?",
          keywords: "location address area",
          answer: (
            <p>
              We deliver to the address you enter at checkout. Please double-check your address and
              phone number so our delivery partner can reach you.
            </p>
          ),
        },
      ],
    },
    {
      id: "account",
      title: "Account",
      items: [
        {
          id: "need-account",
          question: "Do I need an account to shop?",
          keywords: "register sign up login google",
          answer: (
            <p>
              You can browse without one, but you need an account to use the cart and wishlist and
              to check out. You can <Link to="/register" className={linkClass}>register</Link> with
              your email or sign in with Google.
            </p>
          ),
        },
        {
          id: "cart-saved",
          question: "Is my cart saved?",
          keywords: "cart lost devices phone computer",
          answer: (
            <p>
              Yes. Your cart and wishlist are saved to your account, so they're still there when you
              come back or sign in on another device.
            </p>
          ),
        },
        {
          id: "forgot-password",
          question: "I forgot my password. What should I do?",
          keywords: "reset password login code otp",
          answer: (
            <p>
              Use <Link to="/forgot-password" className={linkClass}>Forgot password</Link> on the
              sign-in page. We'll email you a one-time code to reset it.
            </p>
          ),
        },
        {
          id: "delete-account",
          question: "How do I delete my account?",
          keywords: "remove close account data privacy",
          answer: (
            <p>
              Email us from the address on your account and we'll delete it for you. See our{" "}
              <Link to="/privacy-policy" className={linkClass}>Privacy Policy</Link> for details.
            </p>
          ),
        },
      ],
    },
    {
      id: "newsletter",
      title: "Newsletter",
      items: [
        {
          id: "newsletter-email",
          question: "I subscribed but didn't get an email. What now?",
          keywords: "newsletter confirm subscription spam",
          answer: (
            <p>
              After subscribing, we send you an email with a link to confirm your subscription. It
              can take a few minutes, so check your spam or promotions folder too. The link expires
              after 48 hours. If it expired, just subscribe again from the form at the bottom of any
              page.
            </p>
          ),
        },
        {
          id: "unsubscribe",
          question: "How do I unsubscribe?",
          keywords: "newsletter stop emails unsubscribe",
          answer: (
            <p>
              Click "Unsubscribe" at the bottom of any newsletter email. You'll be removed straight
              away, and you can subscribe again whenever you like.
            </p>
          ),
        },
      ],
    },
    {
      id: "reviews",
      title: "Reviews",
      items: [
        {
          id: "write-review",
          question: "How do I review a product?",
          keywords: "rating review comment photo",
          answer: (
            <p>
              Open the product page while signed in and click <strong>Write a Review</strong> in the
              Ratings &amp; Reviews section. You can add a rating, a comment and a photo.
            </p>
          ),
        },
        {
          id: "missing-review",
          question: "Why can't I see my review?",
          keywords: "review hidden removed missing",
          answer: (
            <p>
              Reviews appear straight away, but our team may hide reviews that break our{" "}
              <Link to="/terms" className={linkClass}>review rules</Link>. If you think yours was
              hidden by mistake, contact us.
            </p>
          ),
        },
      ],
    },
  ];

  // Open the question a link points to (e.g. /faq#cancel-order); ScrollToTop scrolls to it
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
  }, [hash]);

  const q = query.trim().toLowerCase();
  const visibleGroups = q
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            `${group.title} ${item.question} ${item.keywords}`.toLowerCase().includes(q),
          ),
        }))
        .filter((group) => group.items.length > 0)
    : groups;
  const matchCount = visibleGroups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="bg-[#FDF8ED] pt-16 text-[#1A1613]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Breadcrumb items={[{ label: "FAQ" }]} />

        <h1 className="text-3xl font-bold sm:text-4xl">Frequently asked questions</h1>
        <p className="mt-3 text-[#1A1613]/70">
          Quick answers about orders, payment, shipping and your account.
        </p>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1A1613]/50" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions, e.g. cancel, delivery, eSewa"
            aria-label="Search questions"
            className="w-full rounded-xl border border-[#1A1613]/20 bg-white py-3 pl-12 pr-11 focus:border-[#E6540B] focus:outline-none focus:ring-1 focus:ring-[#E6540B] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-[#1A1613]/50 hover:bg-[#F4EEDF]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Topic shortcuts (hidden while searching) */}
        {!q && (
          <nav aria-label="FAQ topics" className="mt-4 flex flex-wrap gap-2">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="rounded-full border border-[#1A1613]/15 bg-white px-3.5 py-1.5 text-sm font-medium transition hover:border-[#E6540B] hover:text-[#E6540B]"
              >
                {group.title}
              </a>
            ))}
          </nav>
        )}

        {q && (
          <p className="mt-4 text-sm text-[#1A1613]/60" aria-live="polite">
            {matchCount} {matchCount === 1 ? "question" : "questions"} found
          </p>
        )}

        <div className="mt-8 space-y-10">
          {visibleGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1A1613]/15 bg-white px-4 py-10 text-center">
              <p className="font-medium">No questions match "{query}".</p>
              <p className="mt-1 text-sm text-[#1A1613]/60">
                Try another word, or contact us below. We're happy to help.
              </p>
            </div>
          ) : (
            visibleGroups.map((group) => (
              <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className="scroll-mt-24">
                <h2 id={`${group.id}-title`} className="mb-3 text-lg font-semibold">
                  {group.title}
                </h2>
                <div className="divide-y divide-[#1A1613]/10 overflow-hidden rounded-xl border border-[#1A1613]/10 bg-white">
                  {group.items.map((item) => (
                    // While searching, matches start open (the key resets them when the search changes)
                    <details
                      key={q ? `${item.id}-search` : item.id}
                      id={item.id}
                      open={q ? true : undefined}
                      className="group scroll-mt-24"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium transition-colors hover:bg-[#F4EEDF]/60 [&::-webkit-details-marker]:hidden">
                        {item.question}
                        <ChevronDown className="h-5 w-5 shrink-0 text-[#1A1613]/50 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="px-5 pb-5 leading-relaxed text-[#1A1613]/75">{item.answer}</div>
                    </details>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="mt-12 rounded-xl bg-[#1A1613] p-6 text-white sm:p-8">
          <h2 className="text-xl font-semibold">Still need help?</h2>
          <p className="mt-1 text-white/70">Our team is happy to help with anything else.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {supportEmail && (
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E6540B] px-5 py-2.5 font-semibold transition hover:bg-[#c94806]"
              >
                <Mail className="h-4 w-4" /> Email us
              </a>
            )}
            {supportPhone && (
              <a
                href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-5 py-2.5 font-semibold transition hover:bg-white/10"
              >
                <Phone className="h-4 w-4" /> {supportPhone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
