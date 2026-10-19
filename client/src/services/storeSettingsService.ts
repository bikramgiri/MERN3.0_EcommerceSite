import { useSyncExternalStore } from "react";
import { API, APIAuthenticated } from "../http";

export interface StoreSettings {
  // Store Details
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  currency: string;
  orderPrefix: string;

  // Social links (empty = hidden in the footer)
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  linkedinUrl: string;

  // Orders & Shipping
  standardShippingFee: number;
  freeShippingThreshold: number;
  enableCod: boolean;
  enableOnlinePayment: boolean;
  lowStockThreshold: number;

  // Delivery estimates and return window (shown in the FAQ, Terms and About page)
  localDeliveryArea: string;
  localDeliveryTime: string;
  otherDeliveryTime: string;
  returnWindowDays: number;

  // Notifications
  orderNotificationsEmail: boolean;
  lowStockAlertsEmail: boolean;
  customerReviewAlerts: boolean;
  dashboardSoundAlerts: boolean;

  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export const defaultSettings: StoreSettings = {
  storeName: "Truvora",
  supportEmail: "support@truvora.com",
  supportPhone: "+977 9801234567",
  address: "Kathmandu, Bagmati, Nepal",
  currency: "NPR (Rs.)",
  orderPrefix: "TRV-",

  facebookUrl: "",
  instagramUrl: "",
  xUrl: "",
  linkedinUrl: "",

  standardShippingFee: 100,
  freeShippingThreshold: 2000,
  enableCod: true,
  enableOnlinePayment: true,
  lowStockThreshold: 5,

  localDeliveryArea: "Kathmandu Valley",
  localDeliveryTime: "1–2 business days",
  otherDeliveryTime: "3–5 business days",
  returnWindowDays: 7,

  orderNotificationsEmail: true,
  lowStockAlertsEmail: true,
  customerReviewAlerts: true,
  dashboardSoundAlerts: false,

  maintenanceMode: false,
  maintenanceMessage:
    "We are currently updating our store to serve you better. We'll be back shortly!",
};

// Last settings received from the server, so the first render doesn't flash defaults
export const STORAGE_KEY = "truvora_store_settings";

const readCachedSettings = (): StoreSettings => {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

let currentSettings: StoreSettings = readCachedSettings();

/**
 * Merges settings from the server into the in-memory copy and notifies
 * every component using useStoreSettings()
 */
export const applyStoreSettings = (settings: Partial<StoreSettings>): void => {
  currentSettings = { ...currentSettings, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
  } catch {
    // Storage can be unavailable (private mode); the in-memory copy still works
  }
  window.dispatchEvent(
    new CustomEvent("store_settings_updated", { detail: currentSettings })
  );
};

/** Current settings (synchronous, for non-React code) */
export const getStoreSettings = (): StoreSettings => currentSettings;

const isAdminSession = (): boolean => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.role === "admin" && !!localStorage.getItem("token");
  } catch {
    return false;
  }
};

/**
 * Fetches settings from the server. Admins get every setting;
 * everyone else gets only the public ones.
 */
export const loadStoreSettings = async (): Promise<StoreSettings> => {
  const response = isAdminSession()
    ? await APIAuthenticated.get("/admin/settings")
    : await API.get("/settings");
  applyStoreSettings(response.data.data);
  return currentSettings;
};

/** Saves settings on the server (admin only) */
export const saveStoreSettings = async (
  settings: StoreSettings
): Promise<StoreSettings> => {
  const response = await APIAuthenticated.patch("/admin/settings", settings);
  applyStoreSettings(response.data.data);
  return currentSettings;
};

/**
 * Customer-facing delivery estimate, e.g. "Orders within Kathmandu Valley usually arrive in
 * 1–2 business days. Everywhere else, allow 3–5 business days." Empty when no times are set.
 */
export const describeDeliveryTime = (settings: StoreSettings): string => {
  const area = settings.localDeliveryArea?.trim();
  const local = settings.localDeliveryTime?.trim();
  const other = settings.otherDeliveryTime?.trim();
  const parts: string[] = [];
  if (local) parts.push(area ? `Orders within ${area} usually arrive in ${local}.` : `Orders usually arrive in ${local}.`);
  if (other) parts.push(local ? `Everywhere else, allow ${other}.` : `Orders usually arrive in ${other}.`);
  return parts.join(" ");
};

/**
 * Calculates delivery fee based on order subtotal and active store rules
 */
export const calculateShipping = (
  subtotal: number,
  settings: StoreSettings = getStoreSettings()
): { fee: number; isFree: boolean } => {
  if (subtotal <= 0) return { fee: 0, isFree: true };
  if (
    settings.freeShippingThreshold > 0 &&
    subtotal >= settings.freeShippingThreshold
  ) {
    return { fee: 0, isFree: true };
  }
  return { fee: settings.standardShippingFee, isFree: false };
};

/**
 * Plays a pleasant Web Audio notification chime for real-time dashboard events
 */
export const playNotificationChime = (): void => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1 (A5 - 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2 (E6 - 1320Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.debug("Notification chime could not be played:", e);
  }
};

/**
 * React hook that subscribes to store settings and updates dynamically
 */
const subscribeToSettings = (onChange: () => void) => {
  window.addEventListener("store_settings_updated", onChange);
  return () => window.removeEventListener("store_settings_updated", onChange);
};

export const useStoreSettings = (): StoreSettings =>
  useSyncExternalStore(subscribeToSettings, getStoreSettings);

/**
 * Delivery fee for an edited order, the same rule the server uses: a paid delivery keeps
 * the fee the order was placed with unless the order now qualifies for free delivery;
 * an order that had free delivery is checked against today's rule again.
 */
export const editedOrderShipping = (
  savedFee: number | string | null | undefined,
  subtotal: number,
  settings: StoreSettings = getStoreSettings(),
): number => {
  const { fee: current } = calculateShipping(subtotal, settings);
  const original = savedFee == null ? null : Number(savedFee);
  if (original == null || !Number.isFinite(original) || original <= 0) return current;
  return current === 0 ? 0 : original;
};

/**
 * Customer-facing order number, e.g. "TRV-ef2462": the store prefix plus the last 6
 * characters of the order ID. The server builds the same label for notifications and
 * emails (orderLabel), so shoppers and staff always quote the same number.
 */
export const formatOrderNumber = (id: string, prefix: string = getStoreSettings().orderPrefix): string =>
  `${prefix || "#"}${String(id).slice(-6)}`;

/** Whether a search like "TRV-ef2462", "#ef2462" or "ef24" points at this order */
export const orderNumberMatches = (id: string, query: string, prefix: string = getStoreSettings().orderPrefix): boolean => {
  const q = query.trim().toLowerCase().replace(/^#/, "");
  const p = (prefix || "").toLowerCase();
  const bare = p && q.startsWith(p) ? q.slice(p.length) : q;
  return bare.length > 0 && String(id).toLowerCase().includes(bare);
};
