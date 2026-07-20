import { useEffect, useState, useRef } from "react";
import {
  ShoppingCart,
  Menu,
  X,
  Heart,
  LogOut,
  Settings,
  ChevronDown,
  Bell,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { CgProfile } from "react-icons/cg";
import { logoutUser } from "../../store/auth/authSlice";
import { fetchUserWishlist } from "../../store/customer/wishlistSlice";
import SearchProducts from "./SearchProducts";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // notifications dropdown
  const notificationsRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token } = useAppSelector((state) => state.auth);
  const { wishlist } = useAppSelector((state) => state.wishlist);

  const storedToken =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const effectiveToken = token || storedToken;
  const isLoggedIn = !!effectiveToken;

  useEffect(() => {
    if (effectiveToken) {
      dispatch(fetchUserWishlist());
    }
  }, [dispatch, effectiveToken]);

  const wishlistCount = wishlist?.length;
  const unreadNotifications = 2;

  const cartCount = 0;

  const markAllAsRead = () => {
    // Implement marking notifications as read
    alert("All notifications marked as read!");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    if (isDropdownOpen || isMoreOpen || isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isMoreOpen, isNotificationsOpen]);

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
    setIsDropdownOpen(false);
    setIsMoreOpen(false);
    setIsOpen(false);
    navigate("/login?logout=true");
  };

  const renderAvatar = (size: "small" | "large") => {
    const avatarSize = size === "small" ? "w-10 h-10" : "w-12 h-12";
    const textSize = size === "small" ? "text-xl" : "text-2xl";

    if (user?.avatar) {
      return (
        <img
          className={`${avatarSize} rounded-full object-cover`}
          src={user?.avatar}
          alt={`${user?.username}'s avatar`}
        />
      );
    }

    const initials = user?.username?.charAt(0).toUpperCase() || "U";

    return (
      <div
        className={`${avatarSize} rounded-full bg-[#E6540B] text-white flex items-center justify-center font-bold border-2 border-[#E6540B] ${textSize}`}
      >
        {initials}
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 shadow-md border-b border-[#1A1613]/10 bg-[#FDF8ED]/90 backdrop-blur">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="font-['Fraunces',serif] text-2xl italic font-semibold tracking-tight"
          >
            Truvora<span className="text-[#E6540B]">.</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <Link
              to="/"
              className="text-[#1A1613]/80 hover:hover:text-[#E6540B] font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-[#1A1613]/80 hover:hover:text-[#E6540B] font-medium transition-colors"
            >
              Explore Products
            </Link>
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
                  className="absolute right-0 top-full mt-2 w-30 bg-[#FDF8ED] rounded-md shadow-md py-1 z-50"
                >
                  <Link
                    to="/about"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-[#1A1613]/80 hover:text-[#E6540B] font-medium transition-colors"
                    onClick={() => setIsMoreOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link
                    to="/categories"
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-[#1A1613]/80 hover:text-[#E6540B] font-medium transition-colors"
                    onClick={() => setIsMoreOpen(false)}
                  >
                    Categories
                  </Link>
                </div>
              )}
            </div>
          </div>

          <SearchProducts />

          <div className="flex items-center gap-4 md:gap-6">
            {isLoggedIn && (
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  className="cursor-pointer relative text-[#1A1613]/80 hover:text-[#E6540B] p-1.5 rounded-full hover:bg-[#E6540B]/10 transition-colors"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <Bell className="h-6 w-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-[#FDF8ED] rounded-xl shadow-2xl border border-[#1A1613]/10 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[#E6540B] to-[#c94806] text-white">
                      <h3 className="font-['Fraunces',serif] font-semibold">
                        Notifications
                      </h3>
                      <button
                        onClick={markAllAsRead}
                        className="cursor-pointer text-xs underline hover:text-white/80 transition-colors"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      <div className="cursor-pointer p-4 border-b border-[#1A1613]/10 hover:bg-[#F4EEDF] transition-colors flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-xl">✓</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1613]">
                            Your booking has been{" "}
                            <span className="text-green-600 font-semibold">
                              confirmed
                            </span>
                          </p>
                          <p className="text-xs text-[#1A1613]/60 mt-1">
                            2 minutes ago
                          </p>
                        </div>
                      </div>

                      <div className="cursor-pointer p-4 border-b border-[#1A1613]/10 hover:bg-[#F4EEDF] transition-colors flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-[#E6540B]/10 flex items-center justify-center">
                            <span className="text-[#E6540B] text-xl">%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1613]">
                            Special offer! Get{" "}
                            <span className="text-[#E6540B] font-semibold">
                              20% off
                            </span>{" "}
                            your next booking
                          </p>
                          <p className="text-xs text-[#1A1613]/60 mt-1">
                            1 hour ago
                          </p>
                        </div>
                      </div>

                      <div className="cursor-pointer p-4 hover:bg-[#F4EEDF] transition-colors flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-xl">$</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1613]">
                            Payment of{" "}
                            <span className="font-semibold">$150</span> was
                            successful
                          </p>
                          <p className="text-xs text-[#1A1613]/60 mt-1">
                            Yesterday
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-[#F4EEDF] text-center border-t border-[#1A1613]/10">
                      <Link
                        to="/notifications"
                        className="text-[#E6540B] hover:text-[#c94806] font-medium text-sm transition-colors"
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          setIsOpen(false);
                        }}
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isLoggedIn && (
              <>
                <Link
                  to="/wishlist"
                  className="relative text-[#1A1613]/80 hover:text-[#E6540B] p-1.5 rounded-full transition-colors"
                >
                  <Heart className="h-6 w-6" />
                  {wishlistCount > 0 ? (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {wishlistCount}
                    </span>
                  ) : (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      0
                    </span>
                  )}
                </Link>

                {/* <div {...(items?.length > 0 ? { onClick: () => navigate("/cart") } : {})}
              className="cursor-pointer relative text-[#1A1613]/80 hover:text-[#E6540B] p-1.5 rounded-full transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 ? (
                <span className="absolute top-2 right-50 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                ) : (
                  <span className="absolute top-2 right-50 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    0
                  </span>
              )}
            </div> */}

                <div
                  onClick={() => navigate("/cart")}
                  className="cursor-pointer relative text-[#1A1613]/80 hover:text-[#E6540B] p-1.5 rounded-full transition-colors"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                </div>
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
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 cursor-pointer focus:outline-none"
                  >
                    {renderAvatar("small")}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-66 bg-[#FDF8ED] rounded-md shadow-sm border border-gray-200 py-2 z-50">
                      <div className="px-5 py-4 border-b border-gray-300">
                        <div className="flex items-center gap-3">
                          {renderAvatar("large")}
                          <div>
                            <p className="font-medium text-gray-900">
                              {user?.username || "My Account"}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {user?.email || "user@example.com"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex gap-3 font-normal items-center px-5 py-2 text-gray-900 hover:bg-[#E6540B]/10 hover:text-[#E6540B] transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <CgProfile className="h-6 w-6" />
                          Profile
                        </Link>
                        <Link
                          to="/myorders"
                          className="flex gap-3 font-normal items-center px-5 py-2 text-gray-900 hover:bg-[#E6540B]/10 hover:text-[#E6540B] transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <ShoppingCart className="h-6 w-6" />
                          My Orders
                        </Link>
                        <Link
                          to="/settings"
                          className="flex gap-3 font-normal items-center px-5 py-2 text-gray-900 hover:bg-[#E6540B]/10 hover:text-[#E6540B] transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Settings className="h-6 w-6" />
                          Settings
                        </Link>
                      </div>

                      <div className="border-t border-gray-300">
                        <button
                          onClick={handleLogOut}
                          className="flex mt-2 gap-3 cursor-pointer items-center font-normal w-full px-5 py-2 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <LogOut className="h-6 w-6" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="cursor-pointer md:hidden text-[#E6540B] hover:text-[#E6540B]/80 p-2 rounded-full hover:bg-[#E6540B]/10 focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#FDF8ED] border-t border-gray-100 shadow-md">
          <div className="px-5 py-6 space-y-6">
           <SearchProducts variant="mobile" onNavigate={() => setIsOpen(false)} />

            {!isLoggedIn ? (
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <Link
                  to="/login"
                  className="text-center py-3 text-[#E6540B] font-medium border border-[#E6540B] rounded-lg hover:bg-[#E6540B]/10 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-center py-3 bg-[#E6540B] text-white font-medium rounded-lg hover:bg-[#E6540B]/80 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center gap-3 px-2">
                  {renderAvatar("small")}
                  <div>
                    <p className="font-medium text-gray-900">
                      {user?.username || "Account"}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="py-2">
                  <Link
                    to="/profile"
                    className="block py-2.5 px-2 text-gray-800 hover:text-[#E6540B] hover:bg-[#E6540B]/10 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <CgProfile className="h-5 w-5 inline-block mr-2" />
                    Profile
                  </Link>

                  <Link
                    to="/myorders"
                    className="block py-2.5 px-2 text-gray-800 hover:text-[#E6540B] hover:bg-[#E6540B]/10 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <ShoppingCart className="h-5 w-5 inline-block mr-2" />
                    My Orders
                  </Link>

                  <Link
                    to="/settings"
                    className="block py-2.5 px-2 text-gray-800 hover:text-[#E6540B] hover:bg-[#E6540B]/10 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="h-5 w-5 inline-block mr-2" />
                    Settings
                  </Link>
                </div>
                <button
                  onClick={handleLogOut}
                  className="cursor-pointer w-full text-left py-2.5 px-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 inline-block mr-2" />
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
