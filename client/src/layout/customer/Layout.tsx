import { Outlet } from "react-router-dom";
import Header from "../../components/customer/header/Header";
import Footer from "../../components/customer/footer/Footer";
import { useStoreSettings } from "../../services/storeSettingsService";
import { AlertTriangle } from "lucide-react";

const Layout = () => {
  const storeSettings = useStoreSettings();

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {storeSettings.maintenanceMode && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b border-amber-600/30">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950" />
          <span>
            {storeSettings.maintenanceMessage ||
              "Store is currently undergoing brief maintenance. Browsing is active; ordering is temporarily paused."}
          </span>
        </div>
      )}
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
