import { useState, type FormEvent } from "react";
import { Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { API } from "../../../http";
import { useStoreSettings } from "../../../services/storeSettingsService";
import useIsAdmin from "../../../hooks/useIsAdmin";

const shopLinks = [
  { name: "Home", path: "/" },
  { name: "All products", path: "/products" },
  { name: "About us", path: "/about" },
];

const helpLinks = [
  { name: "FAQ", path: "/faq" },
  { name: "Privacy Policy", path: "/privacy-policy" },
  { name: "Terms of Service", path: "/terms" },
];

const accountLinks = [
  { name: "My orders", path: "/my-orders" },
  { name: "Wishlist", path: "/wishlist" },
  { name: "Cart", path: "/cart" },
  { name: "Profile", path: "/profile" },
];

const linkClass =
  "text-sm text-[#1A1613]/70 transition-colors hover:text-[#E6540B]";

const Footer = () => {
  const storeSettings = useStoreSettings();
  const [email, setEmail] = useState("");

  // Customer-only pages show "403" to admins, so point admins to their dashboard instead
  const isAdmin = useIsAdmin();
  const myAccountLinks = isAdmin
    ? [{ name: "Admin dashboard", path: "/admin-dashboard" }]
    : accountLinks;
  const [isSubscribing, setIsSubscribing] = useState(false);

  const socialLinks = [
    { label: "Facebook", url: storeSettings.facebookUrl, Icon: FaFacebook },
    { label: "Instagram", url: storeSettings.instagramUrl, Icon: FaInstagram },
    { label: "X (Twitter)", url: storeSettings.xUrl, Icon: FaXTwitter },
    { label: "LinkedIn", url: storeSettings.linkedinUrl, Icon: FaLinkedin },
  ].filter((social) => social.url);

  const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubscribing) return;

    setIsSubscribing(true);
    try {
      const response = await API.post("/customer/newsletter", { email });
      toast.success(response.data.message);
      setEmail("");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Couldn't subscribe right now. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="border-t border-[#1A1613]/10 bg-[#FDF8ED] text-[#1A1613]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter */}
        <div className="flex flex-col gap-5 border-b border-[#1A1613]/10 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Get offers and new arrivals first</h2>
            <p className="mt-1 text-sm text-[#1A1613]/60">
              Subscribe to our newsletter. No spam, unsubscribe any time.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            className="flex w-full flex-col gap-3 sm:flex-row md:max-w-md"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1613]/50" />
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-[#1A1613]/20 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-[#1A1613]/50 focus:border-[#E6540B] focus:outline-none focus:ring-1 focus:ring-[#E6540B]"
              />
            </div>
            <button
              type="submit"
              disabled={isSubscribing}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E6540B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c94806] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubscribing ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link
              to="/"
              className="font-['Fraunces',serif] text-2xl font-semibold italic"
            >
              {storeSettings.storeName}
              <span className="text-[#E6540B]">.</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#1A1613]/60">
              Everyday essentials and trending favourites, delivered to your
              door.
            </p>

            {socialLinks.length > 0 && (
              <div className="mt-5 flex gap-4">
                {socialLinks.map(({ label, url, Icon }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-[#1A1613]/60 transition-colors hover:text-[#E6540B]"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <nav aria-label="Shop">
            <h3 className="mb-4 text-sm font-semibold">Shop</h3>
            <ul className="space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={linkClass}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="My account">
            <h3 className="mb-4 text-sm font-semibold">My account</h3>
            <ul className="space-y-2.5">
              {myAccountLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={linkClass}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Help">
            <h3 className="mb-4 text-sm font-semibold">Help</h3>
            <ul className="space-y-2.5">
              {helpLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={linkClass}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sm:col-span-3 lg:col-span-1">
            <h3 className="mb-4 text-sm font-semibold">Contact us</h3>
            <ul className="space-y-3 text-sm text-[#1A1613]/70">
              {storeSettings.supportEmail && (
                <li>
                  <a
                    href={`mailto:${storeSettings.supportEmail}`}
                    className="flex items-start gap-2.5 break-all transition-colors hover:text-[#E6540B]"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#E6540B]" />
                    {storeSettings.supportEmail}
                  </a>
                </li>
              )}
              {storeSettings.supportPhone && (
                <li>
                  <a
                    href={`tel:${storeSettings.supportPhone.replace(/\s+/g, "")}`}
                    className="flex items-start gap-2.5 transition-colors hover:text-[#E6540B]"
                  >
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#E6540B]" />
                    {storeSettings.supportPhone}
                  </a>
                </li>
              )}
              {storeSettings.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E6540B]" />
                  {storeSettings.address}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 border-t border-[#1A1613]/10 py-6 text-sm text-[#1A1613]/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {storeSettings.storeName}. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-[#E6540B]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#E6540B]">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
