import { useEffect } from "react";
import { getStoreSettings } from "../services/storeSettingsService";

/** Sets the browser tab title for a page and restores the previous one on leave */
const usePageTitle = (title?: string) => {
  useEffect(() => {
    const previous = document.title;
    const { storeName } = getStoreSettings();
    document.title = title ? `${title} | ${storeName}` : `${storeName} | Shop everything in one place`;
    return () => {
      document.title = previous;
    };
  }, [title]);
};

export default usePageTitle;
