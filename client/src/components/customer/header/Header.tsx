import { useEffect, useState, useRef } from "react";
import {
  ShoppingCart,
  Menu,
  X,
  Heart,
  LogOut,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { CgProfile } from "react-icons/cg";
import { logoutUser } from "../../../store/auth/authSlice";
import { fetchUserWishlist } from "../../../store/customer/wishlistSlice";
import { fetchCartItems } from "../../../store/customer/cartSlice";
import Notifications from "./components/Notifications";
import SearchProducts from "./components/SearchProducts";
import UserDropdown from "./components/UserDropdown";
import useIsAdmin from "../../../hooks/useIsAdmin";
import MaintenanceBanner from "./components/MaintenanceBanner";
import AnnouncementBar from "./components/AnnouncementBar";
import { connectSocket } from "../../../services/socket";
import { useStoreSettings } from "../../../services/storeSettingsService";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md font-medium transition-colors hover:text-[#E6540B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6540B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#FDF8ED] ${
    isActive ? "text-[#E6540B]" : "text-[#1A1613]/80"
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2.5 font-medium transition-colors hover:bg-[#E6540B]/10 hover:text-[#E6540B] ${
    isActive ? "bg-[#E6540B]/10 text-[#E6540B]" : "text-[#1A1613]/80"
  }`;

const moreLinks = [
  { name: "About Us", path: "/about" },
  { name: "Categories", path: "/#categories" },
  { name: "FAQ", path: "/faq" },
];

const badgeText = (count: number) => (count > 9 ? "9+" : String(count));

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { storeName } = useStoreSettings();
  const { user, token } = useAppSelector((state) => state.auth);
  const { wishlist } = useAppSelector((state) => state.wishlist);
  const { cart } = useAppSelector((state) => state.cart);

  const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");

  const effectiveToken = token || storedToken;
  const effectiveUser = user || storedUser;
  const isLoggedIn = !!effectiveToken && !!effectiveUser;
  const isAdmin = useIsAdmin();
  // Cart and wishlist are customer-only (the API refuses them for admins)
  const isCustomer = isLoggedIn && !isAdmin;

  useEffect(() => {
    if (isCustomer) {
      dispatch(fetchUserWishlist()).catch(() => {});
      dispatch(fetchCartItems()).catch(() => {});
    }
  }, [dispatch, isCustomer]);

  // Re-authenticate the live connection after login/logout
  useEffect(() => {
    connectSocket();
  }, [effectiveToken]);

  // Close menus when the page changes
  const [lastPath, setLastPath] = useState(location.pathname + location.hash);
  if (lastPath !== location.pathname + location.hash) {
    setLastPath(location.pathname + location.hash);
    setIsOpen(false);
    setIsMoreOpen(false);
  }

  const wishlistCount = wishlist?.length || 0;
  const cartCount = (cart || []).reduce((total, item) => total + (Number(item.quantity) || 0), 0);

  useEffect(() => {
    if (!isMoreOpen && !isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMoreOpen, isOpen]);

  const openMoreOnHover = () => {
    if (moreCloseTimer.current) clearTimeout(moreCloseTimer.current);
    setIsMoreOpen(true);
  };

  const scheduleMoreClose = () => {
    if (moreCloseTimer.current) clearTimeout(moreCloseTimer.current);
    moreCloseTimer.current = setTimeout(() => setIsMoreOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (moreCloseTimer.current) clearTimeout(moreCloseTimer.current);
    };
  }, []);

  const handleLogOut = async () => {
    await dispatch(logoutUser());
    setIsMoreOpen(false);
    setIsOpen(false);
    navigate("/login?logout=true");
  };

  const renderAvatar = () => {
    if (effectiveUser?.avatar) {
      return (
        <img
          className="h-10 w-10 rounded-full object-cover"
          src={effectiveUser.avatar}
          referrerPolicy="no-referrer"
          alt={`${effectiveUser?.username}'s avatar`}
        />
      );
    }

    const initials = effectiveUser?.username?.charAt(0).toUpperCase() || "U";

    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#E6540B] bg-[#E6540B] text-xl font-bold text-white">
        {initials}
      </div>
    );
  };

  return (
    // flex column + max height lets the mobile menu scroll below the bar (and maintenance banner)
    <nav className="fixed top-0 left-0 right-0 z-50 flex max-h-dvh flex-col shadow-md border-b border-[#1A1613]/10 bg-[#FDF8ED]/90 backdrop-blur">
      <MaintenanceBanner />
      <AnnouncementBar />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="shrink-0 font-['Fraunces',serif] text-2xl italic font-semibold tracking-tight"
          >
            {storeName}
            <span className="text-[#E6540B]">.</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/products" className={navLinkClass}>
              Explore Products
            </NavLink>
            <div
              className="relative"
              ref={moreRef}
              onMouseEnter={openMoreOnHover}
              onMouseLeave={scheduleMoreClose}
            >
              <button
                type="button"
                onClick={() => setIsMoreOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
                className="cursor-pointer flex items-center gap-1 text-[#1A1613]/80 hover:text-[#E6540B] font-medium transition-colors"
              >
                More
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isMoreOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-40 rounded-lg border border-[#1A1613]/10 bg-[#FDF8ED] py-1.5 shadow-lg z-50"
                >
                  {moreLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      role="menuitem"
                      className="block px-4 py-2 text-sm text-[#1A1613]/80 hover:bg-[#F4EEDF] hover:text-[#E6540B] font-medium transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SearchProducts />

          <div className="flex shrink-0 items-center gap-3 sm:gap-4 md:gap-6">
            {isCustomer && <Notifications />}
            {isCustomer && (
              <>
                <Link
                  to="/wishlist"
                  aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"}
                  className="relative text-[#1A1613]/80 hover:text-[#E6540B] p-1.5 rounded-full transition-colors"
                >
                  <Heart className="h-6 w-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {badgeText(wishlistCount)}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
                  className="relative text-[#1A1613]/80 hover:text-[#E6540B] p-1.5 rounded-full transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {badgeText(cartCount)}
                    </span>
                  )}
                </Link>
              </>
            )}

            <div className="hidden md:flex items-center gap-3">
              {!isLoggedIn ? (
                <>
                  <Link
                    to="/login"
                    className="cursor-pointer flex rounded-lg px-5 py-2 text-base font-medium text-[#1A1613]/80 border border-[#1A1613]/80 hover:bg-[#1A1613]/6 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#E6540B] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#D44A00] transition-colors shadow-sm"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <UserDropdown />
              )}
            </div>

            <button
              type="button"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="cursor-pointer lg:hidden text-[#E6540B] hover:text-[#E6540B]/80 p-2 rounded-full hover:bg-[#E6540B]/10 focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden min-h-0 overflow-y-auto overscroll-contain border-t border-[#1A1613]/10 bg-[#FDF8ED] shadow-md"
        >
          <div className="space-y-5 px-4 py-5 sm:px-6">
            <div className="md:hidden">
              <SearchProducts variant="mobile" onNavigate={() => setIsOpen(false)} />
            </div>

            <div className="flex flex-col gap-1">
              <NavLink to="/" end className={mobileLinkClass}>
                Home
              </NavLink>
              <NavLink to="/products" className={mobileLinkClass}>
                Explore Products
              </NavLink>
              {moreLinks.map((link) =>
                // NavLink ignores the #hash, so "/#categories" would always look active
                link.path.includes("#") ? (
                  <Link key={link.path} to={link.path} className={mobileLinkClass({ isActive: false })}>
                    {link.name}
                  </Link>
                ) : (
                  <NavLink key={link.path} to={link.path} className={mobileLinkClass}>
                    {link.name}
                  </NavLink>
                ),
              )}
            </div>

            {/* From md up, login/account live in the header bar instead */}
            {!isLoggedIn ? (
              <div className="md:hidden flex flex-col gap-3 border-t border-[#1A1613]/10 pt-4">
                <Link
                  to="/login"
                  className="text-center py-3 text-[#E6540B] font-medium border border-[#E6540B] rounded-lg hover:bg-[#E6540B]/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-center py-3 bg-[#E6540B] text-white font-medium rounded-lg hover:bg-[#c94806] transition-colors"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="md:hidden space-y-2 border-t border-[#1A1613]/10 pt-4">
                <div className="flex items-center gap-3 px-3 pb-2">
                  {renderAvatar()}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#1A1613]">
                      {effectiveUser?.username || "My Account"}
                    </p>
                    {effectiveUser?.email && (
                      <p className="truncate text-sm text-[#1A1613]/60">{effectiveUser.email}</p>
                    )}
                  </div>
                </div>

                {isAdmin ? (
                  <NavLink to="/admin-dashboard" className={mobileLinkClass}>
                    <LayoutDashboard className="mr-2 inline-block h-5 w-5" />
                    Admin dashboard
                  </NavLink>
                ) : (
                  <>
                    <NavLink to="/profile" className={mobileLinkClass}>
                      <CgProfile className="mr-2 inline-block h-5 w-5" />
                      Profile
                    </NavLink>
                    <NavLink to="/my-orders" className={mobileLinkClass}>
                      <Package className="mr-2 inline-block h-5 w-5" />
                      My Orders
                    </NavLink>
                    <NavLink to="/setting" className={mobileLinkClass}>
                      <Settings className="mr-2 inline-block h-5 w-5" />
                      Settings
                    </NavLink>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleLogOut}
                  className="cursor-pointer w-full rounded-lg px-3 py-2.5 text-left font-medium text-red-600 transition-colors hover:bg-red-100"
                >
                  <LogOut className="mr-2 inline-block h-5 w-5" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
