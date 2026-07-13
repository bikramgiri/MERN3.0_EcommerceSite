import { Mail, Send} from "lucide-react"; //  Facebook, Instagram, Twitter, Linkedin 
import { Link } from "react-router-dom";

const Footer = () => {
  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/products" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <footer className="bg-[#FDF8ED] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 lg:py-8">
        {/* Main content - 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Column 1 - Brand & Description */}
          <div className="text-center md:text-left">
            <Link to="/" className="inline-block mb-2 font-['Fraunces',serif] text-2xl italic font-semibold">
              Truvora<span className="text-[#E6540B]">.</span>
            </Link>

            <p className="text-[#1A1613]/60 leading-relaxed max-w-md mx-auto md:mx-0">
              Discover quality products with fast delivery and exceptional service.  
              Your one-stop shop for everything you need.
            </p>

            {/* Social Icons */}
            {/* <div className="flex justify-center md:justify-start gap-5 mt-6">
              <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors" aria-label="Facebook">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors" aria-label="Instagram">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors" aria-label="Twitter">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-6 w-6" />
              </a>
            </div> */}
          </div>

          {/* Column 2 - Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold text-[#1A1613] mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-[#1A1613]/80 hover:text-[#E6540B] transition-colors duration-200 text-base block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Support Links */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold text-[#1A1613] mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              {[
                { name: "FAQ", path: "/faq" },
                { name: "Shipping Info", path: "/shipping" },
                { name: "Returns & Refunds", path: "/returns" },
                { name: "Privacy Policy", path: "/privacy" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-[#1A1613]/80 hover:text-[#E6540B] transition-colors duration-200 text-base block"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Newsletter */}
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold text-[#1A1613] mb-4">
              Newsletter
            </h4>

            <p className="text-[#1A1613]/60 mb-5">
              Subscribe to get latest updates, offers and news.
            </p>

            <form className="flex flex-col gap-4 max-w-md mx-auto md:mx-0">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1A1613]/60" />
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#1A1613]/30 focus:outline-none focus:ring-1 focus:ring-[#E6540B] focus:border-transparent text-[#1A1613] placeholder:text-[#1A1613]/60"
                  required
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#E6540B] text-white font-medium rounded-lg hover:bg-[#D44A00] transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                <Send className="h-5 w-5" />
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-[#1A1613]/30">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#1A1613]/60">
            <p>
              © {new Date().getFullYear()} Truvora. All rights reserved.
            </p>

            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-[#E6540B] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[#E6540B] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;