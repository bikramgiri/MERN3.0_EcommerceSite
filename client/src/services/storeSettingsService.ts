import { useState, useEffect } from "react";

export interface StoreSettings {
  // Store Details
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  currency: string;
  orderPrefix: string;

  // Orders & Shipping
  standardShippingFee: number;
  freeShippingThreshold: number;
  enableCod: boolean;
  enableOnlinePayment: boolean;
  lowStockThreshold: number;

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

  standardShippingFee: 100,
  freeShippingThreshold: 2000,
  enableCod: true,
  enableOnlinePayment: true,
  lowStockThreshold: 5,

  orderNotificationsEmail: true,
  lowStockAlertsEmail: true,
  customerReviewAlerts: true,
  dashboardSoundAlerts: false,

  maintenanceMode: false,
  maintenanceMessage:
    "We are currently updating our store to serve you better. We'll be back shortly!",
};

export const STORAGE_KEY = "truvora_admin_settings";

/**
 * Safely retrieves stored settings or returns defaults
 */
export const getStoreSettings = (): StoreSettings => {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to parse store settings:", e);
    return defaultSettings;
  }
};

/**
 * Persists settings to localStorage and dispatches a cross-component event
 */
export const saveStoreSettings = (settings: StoreSettings): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent("store_settings_updated", { detail: settings })
  );
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
      window.AudioContext || (window as any).webkitAudioContext;
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
export const useStoreSettings = (): StoreSettings => {
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings());

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<StoreSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(getStoreSettings());
      }
    };
    window.addEventListener("store_settings_updated", handler);
    return () => window.removeEventListener("store_settings_updated", handler);
  }, []);

  return settings;
};
