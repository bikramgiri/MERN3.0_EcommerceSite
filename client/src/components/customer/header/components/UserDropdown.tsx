import { LayoutDashboard, LogOut, Settings, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CgProfile } from "react-icons/cg";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../../hooks/hooks";
import { logoutUser } from "../../../../store/auth/authSlice";
import { UserRole } from "../../../../types/customer/authTypes";

const UserDropdown = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [, setIsMoreOpen] = useState(false);
  const [, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAppSelector((state) => state.auth);

  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const effectiveUser = user || storedUser;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogOut = async () => {
    await dispatch(logoutUser());
    setIsDropdownOpen(false);
    setIsMoreOpen(false);
    setIsOpen(false);
    navigate("/login?logout=true");
  };

  const getDashboardPath = () => {
    if (!effectiveUser) return "/";
    if (effectiveUser.role === "admin") return "/admin-dashboard";
    return "/";
  };

  const renderAvatar = (size: "small" | "large") => {
    const avatarSize = size === "small" ? "w-10 h-10" : "w-12 h-12";
    const textSize = size === "small" ? "text-xl" : "text-2xl";

    if (effectiveUser?.avatar) {
      return (
        <img
          className={`${avatarSize} rounded-full object-cover`}
          src={effectiveUser?.avatar}
          alt={`${effectiveUser?.username}'s avatar`}
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
                  {effectiveUser?.username || "My Account"}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {effectiveUser?.email || "user@example.com"}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
             {effectiveUser?.role === UserRole.Admin ? (
              <>
              <Link
                to={getDashboardPath()}
                className="flex gap-3 font-noraml items-center px-5 py-2 text-gray-900 hover:bg-[#E6540B]/10 hover:text-[#E6540B] transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <LayoutDashboard className="h-6 w-6" />
                Dashboard
              </Link>
              </>
             ) : (
              <> 
            <Link
              to="/profile"
              className="flex gap-3 font-normal items-center px-5 py-2 text-gray-900 hover:bg-[#E6540B]/10 hover:text-[#E6540B] transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <CgProfile className="h-6 w-6" />
              Profile
            </Link>
            <Link
              to="/my-orders"
              className="flex gap-3 font-normal items-center px-5 py-2 text-gray-900 hover:bg-[#E6540B]/10 hover:text-[#E6540B] transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <ShoppingCart className="h-6 w-6" />
              My Orders
            </Link>
            <Link
              to="/setting"
              className="flex gap-3 font-normal items-center px-5 py-2 text-gray-900 hover:bg-[#E6540B]/10 hover:text-[#E6540B] transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Settings className="h-6 w-6" />
              Setting
            </Link>
            </>
            )}
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
  );
};

export default UserDropdown;
