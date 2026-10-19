import StoreSetting from "../database/models/storeSettingModel";

const SETTINGS_ID = 1;

const STRING_FIELDS = [
  "storeName",
  "supportEmail",
  "supportPhone",
  "address",
  "currency",
  "orderPrefix",
  "maintenanceMessage",
  "facebookUrl",
  "instagramUrl",
  "xUrl",
  "linkedinUrl",
  "localDeliveryArea",
  "localDeliveryTime",
  "otherDeliveryTime",
] as const;

const URL_FIELDS = ["facebookUrl", "instagramUrl", "xUrl", "linkedinUrl"] as const;

const NUMBER_FIELDS = [
  "standardShippingFee",
  "freeShippingThreshold",
  "lowStockThreshold",
  "returnWindowDays",
] as const;

const BOOLEAN_FIELDS = [
  "enableCod",
  "enableOnlinePayment",
  "orderNotificationsEmail",
  "lowStockAlertsEmail",
  "customerReviewAlerts",
  "dashboardSoundAlerts",
  "maintenanceMode",
] as const;

// Settings shoppers are allowed to see; everything else is admin-only
const PUBLIC_FIELDS = [
  "storeName",
  "supportEmail",
  "supportPhone",
  "address",
  "currency",
  "orderPrefix",
  "standardShippingFee",
  "freeShippingThreshold",
  "enableCod",
  "enableOnlinePayment",
  "maintenanceMode",
  "maintenanceMessage",
  "facebookUrl",
  "instagramUrl",
  "xUrl",
  "linkedinUrl",
  "localDeliveryArea",
  "localDeliveryTime",
  "otherDeliveryTime",
  "returnWindowDays",
] as const;

const NUMBER_LABELS: Record<(typeof NUMBER_FIELDS)[number], string> = {
  standardShippingFee: "Shipping fee",
  freeShippingThreshold: "Free shipping threshold",
  lowStockThreshold: "Low stock threshold",
  returnWindowDays: "Return window",
};

export type StoreSettings = Pick<
  StoreSetting,
  | (typeof STRING_FIELDS)[number]
  | (typeof NUMBER_FIELDS)[number]
  | (typeof BOOLEAN_FIELDS)[number]
>;

let cachedSettings: StoreSettings | null = null;

const toPlain = (row: StoreSetting): StoreSettings => {
  const { id, createdAt, updatedAt, updatedBy, ...settings } = row.toJSON();
  return settings as StoreSettings;
};

/** Creates the settings row with defaults on first start */
export const ensureStoreSettings = async (): Promise<void> => {
  await StoreSetting.findOrCreate({ where: { id: SETTINGS_ID } });
};

/** Returns all settings, cached in memory until the next update */
export const getStoreSettings = async (): Promise<StoreSettings> => {
  if (cachedSettings) return cachedSettings;

  const [row] = await StoreSetting.findOrCreate({ where: { id: SETTINGS_ID } });
  cachedSettings = toPlain(row);
  return cachedSettings;
};

export const getPublicStoreSettings = async () => {
  const settings = await getStoreSettings();
  return Object.fromEntries(
    PUBLIC_FIELDS.map((key) => [key, settings[key]]),
  ) as Pick<StoreSettings, (typeof PUBLIC_FIELDS)[number]>;
};

/**
 * Validates a (partial) settings update from the admin.
 * Unknown fields are ignored; returns the cleaned data or the first error.
 */
export const validateSettingsUpdate = (
  body: Record<string, unknown>,
): { data: Partial<StoreSettings>; error?: { field: string; message: string } } => {
  const data: Record<string, unknown> = {};

  for (const key of STRING_FIELDS) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "string") {
      return { data: {}, error: { field: key, message: `${key} must be text` } };
    }
    data[key] = (body[key] as string).trim();
  }

  for (const key of NUMBER_FIELDS) {
    if (body[key] === undefined) continue;
    const value = Number(body[key]);
    if (!Number.isInteger(value) || value < 0) {
      return {
        data: {},
        error: {
          field: key,
          message: `${NUMBER_LABELS[key]} must be a whole number of 0 or more`,
        },
      };
    }
    data[key] = value;
  }

  for (const key of BOOLEAN_FIELDS) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "boolean") {
      return { data: {}, error: { field: key, message: `${key} must be true or false` } };
    }
    data[key] = body[key];
  }

  if (data.storeName === "") {
    return { data: {}, error: { field: "storeName", message: "Store name is required" } };
  }
  if (
    data.supportEmail !== undefined &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.supportEmail as string)
  ) {
    return {
      data: {},
      error: { field: "supportEmail", message: "Please enter a valid email address" },
    };
  }
  if (data.orderPrefix === "") {
    return { data: {}, error: { field: "orderPrefix", message: "Order prefix is required" } };
  }
  for (const key of URL_FIELDS) {
    const value = data[key] as string | undefined;
    if (value && !/^https:\/\/[^\s]+\.[^\s]+$/i.test(value)) {
      return {
        data: {},
        error: { field: key, message: "Link must be a full https:// address" },
      };
    }
  }
  if (data.lowStockThreshold !== undefined && (data.lowStockThreshold as number) < 1) {
    return {
      data: {},
      error: { field: "lowStockThreshold", message: "Low stock threshold must be at least 1" },
    };
  }

  return { data: data as Partial<StoreSettings> };
};

export const updateStoreSettings = async (
  data: Partial<StoreSettings>,
  updatedBy: string | null,
): Promise<StoreSettings> => {
  const [row] = await StoreSetting.findOrCreate({ where: { id: SETTINGS_ID } });
  await row.update({ ...data, updatedBy });
  cachedSettings = toPlain(row);
  return cachedSettings;
};

/** Shipping fee for an order subtotal, using the same rule as the storefront */
export const calculateShippingCost = (
  subtotal: number,
  settings: StoreSettings,
): number => {
  if (subtotal <= 0) return 0;
  if (
    settings.freeShippingThreshold > 0 &&
    subtotal >= settings.freeShippingThreshold
  ) {
    return 0;
  }
  return settings.standardShippingFee;
};
