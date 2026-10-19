import { Heart, LayoutDashboard, LogOut, Package, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../hooks/hooks";
import { logoutUser } from "../../../../store/auth/authSlice";
import useIsAdmin from "../../../../hooks/useIsAdmin";

const itemClass =
  "flex items-center gap-3 px-5 py-2 text-[#1A1613] transition-colors hover:bg-[#E6540B]/10 hover:text-[#E6540B]";

const customerLinks = [
  { name: "Profile", path: "/profile", icon: <CgProfile className="h-5 w-5" /> },
  { name: "My Orders", path: "/my-orders", icon: <Package className="h-5 w-5" /> },
  { name: "Wishlist", path: "/wishlist", icon: <Heart className="h-5 w-5" /> },
  { name: "Settings", path: "/setting", icon: <Settings className="h-5 w-5" /> },
];

const UserDropdown = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAppSelector((state) => state.auth);
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const effectiveUser = user || storedUser;

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  const handleLogOut = async () => {
    await dispatch(logoutUser());
    setIsDropdownOpen(false);
    navigate("/login?logout=true");
  };

  const renderAvatar = (size: "small" | "large") => {
    const avatarSize = size === "small" ? "w-10 h-10" : "w-12 h-12";
    const textSize = size === "small" ? "text-xl" : "text-2xl";

    if (effectiveUser?.avatar) {
      return (
        <img
          className={`${avatarSize} rounded-full object-cover`}
          src={effectiveUser.avatar}
          referrerPolicy="no-referrer"
          alt=""
        />
      );
    }

    const initials = effectiveUser?.username?.charAt(0).toUpperCase() || "U";

    return (
      <div
        className={`${avatarSize} rounded-full bg-[#E6540B] text-white flex items-center justify-center font-bold border-2 border-[#E6540B] ${textSize}`}
      >
        {initials}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={isDropdownOpen}
        className="flex items-center gap-2 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6540B] focus-visible:ring-offset-2"
      >
        {renderAvatar("small")}
      </button>

      {isDropdownOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-66 rounded-lg border border-[#1A1613]/10 bg-[#FDF8ED] py-2 shadow-lg z-50"
        >
          <div className="border-b border-[#1A1613]/10 px-5 py-4">
            <div className="flex items-center gap-3">
              {renderAvatar("large")}
              <div className="min-w-0">
                <p className="truncate font-medium text-[#1A1613]">
                  {effectiveUser?.username || "My Account"}
                </p>
                {effectiveUser?.email && (
                  <p className="truncate text-sm text-[#1A1613]/60">{effectiveUser.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="py-2">
            {isAdmin ? (
              <Link
                to="/admin-dashboard"
                role="menuitem"
                className={itemClass}
                onClick={() => setIsDropdownOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                Admin dashboard
              </Link>
            ) : (
              customerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  role="menuitem"
                  className={itemClass}
                  onClick={() => setIsDropdownOpen(false)}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-[#1A1613]/10 pt-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogOut}
              className="flex w-full cursor-pointer items-center gap-3 px-5 py-2 text-red-600 transition-colors hover:bg-red-100"
            >
              <LogOut className="h-5 w-5" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
