import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { BsSearch } from "react-icons/bs";
import { useSidebar } from "../../context/SidebarContext";
import DropdownUser from "../../components/admin/Header/DropdownUser";
import { ThemeToggleButton } from "../../components/admin/Header/ThemeToggleButton";
import DropdownNotifications from "../../components/admin/Header/DropDownNotifications";

const AdminHeader: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar, toggleSidebar} = useSidebar();
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSearch && searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch]);

  // Focus input when search opens on mobile
  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  //   const handleToggle = () => {
  //   if (window.innerWidth >= 1024) {
  //     toggleSidebar();
  //   } else {
  //     toggleMobileSidebar();
  //   }
  // };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-19 px-4 sm:px-6">
        {/* Left: Hamburger + Logo/Search trigger */}
        <div className="flex items-center sm:gap-4">
          {/* Hamburger menu (mobile only) */}
          {/* <button
            onClick={handleToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden focus:outline-none"
            aria-label="Toggle sidebar"
          >
            {isMobileOpen ? <X size={24} className="focus:outline-none focus:ring-0" /> : ( 
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>)}
          </button> */}
          <button
            className="cursor-pointer focus:outline-none focus:ring-0 items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-200 border-gray-300 rounded-lg  lg:flex lg:h-11 lg:w-11 lg:border-gray-200 lg:border"
            onClick={handleToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="18"
                height="16"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          {/* Desktop search (always visible on lg+) */}
          <div className="hidden lg:block">
            <div className="relative">
              <BsSearch className="absolute focus:outline-none focus:ring-0 left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search ..."
                className="h-10 w-[360px] pl-10 pr-4 rounded-lg border border-gray-300 text-sm 
                           focus:border-gray-300 focus:ring-1 focus:ring-gray-300 outline-none"
              />
            </div>
          </div>

          {/* Mobile search toggle button */}
          <button
            className="p-2 focus:outline-none focus:ring-0 rounded-lg hover:bg-gray-100 lg:hidden"
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Toggle search"
          >
            {showSearch ? <X size={20} className="focus:outline-none focus:ring-0" /> : <BsSearch size={20} className="focus:outline-none focus:ring-0" />}
          </button>
        </div>

        {/* Right side: actions (always visible) */}
        <div className="flex items-center gap-4 sm:gap-6">
          <ThemeToggleButton />
          <DropdownNotifications />
          <DropdownUser />
        </div>
      </div>

      {/* Mobile search bar – full width, appears below header */}
      {showSearch && (
        <div 
          className="lg:hidden px-4 pb-4 bg-white border-b border-gray-200 animate-fade-in"
          ref={searchRef}
        >
          <div className="relative">
            <BsSearch className="absolute focus:outline-none focus:ring-0 left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search or type command..."
              className="w-full h-11 pl-10 pr-10 rounded-lg border border-gray-300 text-sm 
                         focus:border-gray-300 focus:ring-1 focus:ring-gray-300 outline-none"
              autoFocus
            />
            {/* Optional clear button */}
            <button
              className="absolute focus:outline-none focus:ring-0 right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowSearch(false)}
              aria-label="Close search"
            >
              <X size={18} className="focus:outline-none focus:ring-0" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;