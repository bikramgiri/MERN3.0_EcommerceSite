import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ClickOutside from '../ClickOutside';
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { CgProfile } from "react-icons/cg";
import { useAppDispatch, useAppSelector } from '../../../hooks/hooks';
import { logout } from '../../../store/auth/authSlice';

const DropdownUser = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token } = useAppSelector((state) => state.auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  
  const effectiveToken = token || storedToken;
  const effectiveUser = user || storedUser;

  const isLoggedIn = !!effectiveToken && !!effectiveUser; 


  const handleLogOut = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setDropdownOpen(false);
    navigate("/login?logout=true");
  };

  const renderAvatar = (size: "small" | "large") => {
    const avatarSize = size === "small" ? "w-9 h-9 sm:w-10 sm:h-10" : "w-12 h-12";
    const textSize = size === "small" ? "text-lg sm:text-xl" : "text-2xl";
    if (effectiveUser?.avatar) {
      return (
        <img
          className={`${avatarSize} rounded-full object-cover border-2 border-[#E6540B]/25`}
          src={effectiveUser.avatar}
          alt="User avatar"
        />
      );
    }

    const initials = effectiveUser?.username?.charAt(0).toUpperCase() || "U";

    return (
      <div
        className={`${avatarSize} rounded-full bg-[#E6540B] text-[#FDF8ED] flex items-center justify-center font-['Fraunces',serif] font-semibold border-2 border-[#E6540B]/25 ${textSize}`}
      >
        {initials}
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <Link
        to="/login"
        className="cursor-pointer flex rounded-lg px-4 py-2 sm:px-5 text-sm sm:text-base font-medium text-[#E6540B] border-2 border-[#E6540B] hover:bg-[#E6540B]/10 transition-colors"
      >
        Login
      </Link>
    );
  }

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="cursor-pointer flex items-center gap-2 sm:gap-4"
        to="#"
      >
        <span className="rounded-full">{renderAvatar('small')}</span>

        <span className="hidden text-left sm:block">
          <span className="block max-w-[8rem] truncate text-sm font-medium text-[#1A1613] md:max-w-[12rem]">
            {effectiveUser?.username || 'Admin User'}
          </span>
          <span className="block max-w-[8rem] truncate text-xs text-[#1A1613]/55 md:max-w-[12rem]">
            {effectiveUser?.email || 'admin@gmail.com'}
          </span>
        </span>

        <ChevronDown
          className={`hidden sm:block flex-shrink-0 text-[#1A1613]/60 transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
          size={20}
        />
      </Link>

      {dropdownOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[calc(100vw-2rem)] max-w-72 rounded-md border border-[#1A1613]/10 bg-[#FFFDF8] py-2 shadow-xl shadow-[#1A1613]/10 sm:w-72">
          <div className="border-b border-[#1A1613]/10 px-5 py-4">
            <div className="flex items-center gap-3">
              {renderAvatar('large')}
              <div className="min-w-0">
                <p className="truncate font-medium text-[#1A1613]">
                  {effectiveUser?.username || 'Admin User'}
                </p>
                <p className="truncate text-sm text-[#1A1613]/55">
                  {effectiveUser?.email || 'admin@gmail.com'}
                </p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-5 py-2.5 text-[#1A1613] transition-colors hover:bg-[#F4EEDF] hover:text-[#E6540B]"
              onClick={() => setDropdownOpen(false)}
            >
              <CgProfile className="h-5 w-5 sm:h-6 sm:w-6" />
              Profile
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-5 py-2.5 text-[#1A1613] transition-colors hover:bg-[#F4EEDF] hover:text-[#E6540B]"
              onClick={() => setDropdownOpen(false)}
            >
              <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
              Settings
            </Link>
          </div>

          <div className="border-t border-[#1A1613]/10 pt-2">
            <button
              onClick={handleLogOut}
              className="focus:outline-none focus:ring-0 flex w-full cursor-pointer items-center gap-3 px-5 py-2 text-red-600 transition-colors hover:bg-[#9B3A2E]/10"
            >
              <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
              Log out
            </button>
          </div>
        </div>
      )}
    </ClickOutside>
  );
};

export default DropdownUser;