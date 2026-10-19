import { AlertTriangle } from "lucide-react";
import { useStoreSettings } from "../../../../services/storeSettingsService";

interface MaintenanceBannerProps {
  /**
   * Renders an invisible copy that takes up the same height in the page flow,
   * so content isn't hidden behind the fixed header while the banner is shown.
   */
  placeholder?: boolean;
}

const MaintenanceBanner = ({ placeholder = false }: MaintenanceBannerProps) => {
  const { maintenanceMode, maintenanceMessage } = useStoreSettings();

  if (!maintenanceMode) return null;

  return (
    <div
      role={placeholder ? undefined : "status"}
      aria-hidden={placeholder || undefined}
      className={`flex items-center justify-center gap-2 border-b border-amber-600/30 bg-amber-500 px-4 py-2 text-center text-xs font-medium text-amber-950 sm:text-sm ${
        placeholder ? "invisible" : ""
      }`}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        {maintenanceMessage ||
          "Store is currently undergoing brief maintenance. Browsing is active; ordering is temporarily paused."}
      </span>
    </div>
  );
};

export default MaintenanceBanner;
