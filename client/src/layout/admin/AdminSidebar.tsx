import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

import {
  GridIcon,
  ChatIcon,
  UserCircleIcon,
} from "../../icons";
import { Link } from "react-router-dom";
import {Analytics, Products, Setting, Users, Categories}  from "../../icons/icons";
import { ShoppingCart, Sparkles, X } from "lucide-react";
import SidebarWidget from "./SidebarWidget";
import { useSidebar } from "../../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon:   <img src={GridIcon} alt="" className="h-6 w-6" />,
    name: 'Dashboard',
    path: '/admin-dashboard',
  },
  {
    icon: Analytics,
    name: 'Analytics',
    path: 'admin-dashboard/analytics',
  },
  {
    icon: Users,
    name: 'User Management',
    path: 'admin-dashboard/users',
  },
    {
    icon: Categories,
    name: 'Categories',
    path: 'admin-dashboard/categories',
  },
  {
    icon: Products,
    name: 'Products',
    path: 'admin-dashboard/products',
  },
  {
    icon: <ShoppingCart />,
    name: 'Orders',
    path: 'admin-dashboard/orders',
  },
    {
    icon: <Sparkles />,
    name: 'Reviews',
    path: 'admin-dashboard/reviews',
  },
  {
    icon: <img src={UserCircleIcon} alt="" className="h-6 w-6" />,
    name: 'User Profile',
    path: 'admin-dashboard/profile',
  },
  {
    icon: <img src={ChatIcon} alt="" className="h-6 w-6" />,
    name: 'Chat',
    path: 'admin-dashboard/chat',
  },
  {
    icon: Setting,
    name: 'Settings',
    path: 'admin-dashboard/settings',
  }
];

const AdminSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : [];
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setTimeout(() => setOpenSubmenu(null), 100);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu(prev =>
      prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }
    );
  }
  

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        toggleMobileSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileOpen, toggleMobileSidebar]);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);
  

  // Truvora warm palette — accent clay-orange active state instead of indigo
  const activeClasses = `
    bg-[#E6540B]/10 border border-[#E6540B]/25 text-[#E6540B]
    rounded-lg
    font-semibold
  `;

  const inactiveClasses = `
    text-[#1A1613]/70
    hover:bg-[#F4EEDF]
    hover:text-[#1A1613]
  `;

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col px-1.5 gap-4 font-medium">
      {items.map((nav, index) => (
        <li key={nav.name} 
        className={`rounded-lg transition-all duration-200 ${
            nav.path && isActive(nav.path) ? activeClasses : inactiveClasses
          }`}
        >
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`outline-none focus:outline-none flex gap-3 items-center w-full py-2 px-3 rounded-lg transition-all duration-200
                ${openSubmenu?.type === menuType && openSubmenu?.index === index ? "font-semibold" : ""}
                ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span className="menu-item-icon-size flex-shrink-0">{nav.icon}</span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text flex-1 text-left">{nav.name}</span>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`outline-none focus:outline-none flex gap-3 items-center py-2 px-3 rounded-lg transition-all duration-200
                  ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span className="menu-item-icon-size flex-shrink-0">{nav.icon}</span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text flex-1 text-left">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {subMenuRefs.current[`${menuType}-${index}`] = el;}}
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-1.5 mb-2 space-y-1 ml-8">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`outline-none focus:outline-none block py-1.5 px-3 rounded-md text-sm transition-colors
                        ${isActive(subItem.path)
                          ? "bg-[#E6540B]/10 text-[#E6540B] font-semibold"
                          : "text-[#1A1613]/60 hover:bg-[#F4EEDF]"}`}
                    >
                      {subItem.name}
                      <span className="float-right text-xs">
                        {subItem.new && <span className="text-[#4F6B4A]">new</span>}
                        {subItem.pro && <span className="text-[#9B3A2E]">pro</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
 <>
    {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#1A1613]/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

    <aside
    ref={sidebarRef}
      className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out bg-[#FFFDF8] border-r border-[#1A1613]/10 shadow-md shadow-[#1A1613]/5 flex flex-col
      ${
        isExpanded || isMobileOpen
          ? 'w-[260px]'
          : isHovered
          ? 'w-[260px]'
          : 'w-[100px]'
      }
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(false)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`focus:outline-none focus:ring-0 flex items-center h-19 px-2 border-b border-[#1A1613]/10 justify-between ${
          !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
        }`}
      >
        <Link to="/"
        className="flex items-center gap-3 outline-none focus:outline-none"
        >
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-2">
              <p className="focus:outline-none focus:ring-0">
                <span className="text-[#FDF8ED] py-1.5 px-3 rounded-md bg-[#E6540B] font-['Fraunces',serif] font-semibold text-2xl">T</span>
              </p>
            <div className="flex-1 min-w-0">
              <p className="font-['Fraunces',serif] text-xl italic font-semibold text-[#1A1613]">
                Truvora<span className="text-[#E6540B]">.</span>
              </p>
              <p className="text-sm font-medium text-[#1A1613]/55 truncate">
           Admin Panel
          </p>
            </div>
            </div>
          ) : (
            <p className="focus:outline-none focus:ring-0">
                <span className="text-[#FDF8ED] py-1.5 px-3 rounded-md bg-[#E6540B] font-['Fraunces',serif] font-semibold text-2xl">T</span>
              </p>
          )}
        </Link>

        {/* Mobile close button */}
          <button
            className="outline-none focus:outline-none lg:hidden bg-[#F4EEDF] p-1.5 hover:bg-[#EDE5D0] rounded-full text-[#1A1613]"
            onClick={toggleMobileSidebar}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
          {renderMenuItems(navItems, "main")}
      </nav>
     
      <SidebarWidget />
    </aside>
    </>
  );
};

export default AdminSidebar;