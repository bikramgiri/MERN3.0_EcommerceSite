import { Outlet } from "react-router";
import AdminHeader from "./AdminHeader";
import Backdrop from "./Backdrop";
import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import AdminSidebar from "./AdminSidebar";
import { Suspense, useEffect } from "react";
import { loadStoreSettings } from "../../services/storeSettingsService";
import { AdminContentSkeleton } from "./AdminPageSkeleton";
import { useTheme } from "../../context/ThemeContext";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex dark:bg-[#14110F] dark:text-[#F5EFE6]">
      <div>
        <AdminSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[260px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AdminHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {/* Keeps the sidebar and header on screen while a page chunk loads */}
          <Suspense fallback={<AdminContentSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

const AdminLayout: React.FC = () => {
  // Load the admin-only settings too (e.g. dashboard sound alerts)
  useEffect(() => {
    loadStoreSettings().catch(() => {});
  }, []);

  const { theme } = useTheme();

  return (
    // Dark mode is scoped to the admin area; `dark:` styles apply inside this wrapper
    <div className={theme === "dark" ? "dark" : undefined} style={{ colorScheme: theme }}>
      <SidebarProvider>
        <LayoutContent />
      </SidebarProvider>
    </div>
  );
};

export default AdminLayout;
