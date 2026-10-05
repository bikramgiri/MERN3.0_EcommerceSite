import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Store,
  Truck,
  Bell,
  Sliders,
  Loader2,
  Check,
  AlertTriangle,
  Volume2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  StoreSettings,
  defaultSettings,
  getStoreSettings,
  saveStoreSettings,
  playNotificationChime,
} from "../../services/storeSettingsService";

const SettingsSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans animate-pulse">
      {/* Header Skeleton */}
      <div className="pb-4 border-b border-gray-200">
        <div className="h-7 w-44 rounded-md bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-100 mt-2" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 border-b border-gray-200 pb-2 overflow-x-auto">
        <div className="h-5 w-20 rounded bg-gray-200 shrink-0" />
        <div className="h-5 w-28 rounded bg-gray-200 shrink-0" />
        <div className="h-5 w-24 rounded bg-gray-200 shrink-0" />
        <div className="h-5 w-24 rounded bg-gray-200 shrink-0" />
      </div>

      {/* Card Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs divide-y divide-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-5">
          <div className="h-5 w-36 rounded bg-gray-200" />
          <div className="h-3 w-64 rounded bg-gray-100 mt-2" />
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="h-3.5 w-20 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-24 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-24 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-20 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="bg-gray-50/70 px-4 sm:px-6 py-3.5 flex justify-end">
          <div className="h-9 w-28 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "general" | "orders" | "notifications" | "maintenance"
  >("general");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["general", "orders", "notifications", "maintenance"].includes(tabParam)
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetModal, setShowResetModal] = useState(false);

  const [savedSettings, setSavedSettings] = useState<StoreSettings>(defaultSettings);
  const [formData, setFormData] = useState<StoreSettings>(defaultSettings);

  // Load saved settings on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = getStoreSettings();
        setSavedSettings(stored);
        setFormData(stored);
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setIsLoading(false);
      }
    }, 350); // Brief simulated initial load to showcase clean skeleton

    return () => clearTimeout(timer);
  }, []);

  // Check if form has unsaved edits
  const isDirty = JSON.stringify(formData) !== JSON.stringify(savedSettings);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = "Store name is required";
    }

    if (!formData.supportEmail.trim()) {
      newErrors.supportEmail = "Support email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supportEmail)) {
      newErrors.supportEmail = "Please enter a valid email address";
    }

    if (formData.standardShippingFee < 0) {
      newErrors.standardShippingFee = "Shipping fee cannot be negative";
    }

    if (formData.freeShippingThreshold < 0) {
      newErrors.freeShippingThreshold = "Free shipping threshold cannot be negative";
    }

    if (formData.lowStockThreshold < 1) {
      newErrors.lowStockThreshold = "Low stock threshold must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleToggle = (key: keyof StoreSettings) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDiscard = () => {
    setFormData(savedSettings);
    setErrors({});
  };

  const handleResetToDefaults = () => {
    setFormData(defaultSettings);
    setErrors({});
    setShowResetModal(false);
    toast.info("Reset to default settings. Click 'Save settings' to persist.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setIsSaving(true);

    try {
      // Simulate quick async persistence
      await new Promise((resolve) => setTimeout(resolve, 250));
      saveStoreSettings(formData);
      setSavedSettings(formData);
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans">
      {/* 1. Page Header */}
      <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-heading">
            Store Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store identity, checkout preferences, and notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="self-start sm:self-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Restore defaults
        </button>
      </div>

      {/* 2. Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === "general"
              ? "border-[#E6540B] text-[#E6540B]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>General</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === "orders"
              ? "border-[#E6540B] text-[#E6540B]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Orders & Shipping</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === "notifications"
              ? "border-[#E6540B] text-[#E6540B]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("maintenance")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === "maintenance"
              ? "border-[#E6540B] text-[#E6540B]"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Store Status</span>
          {formData.maintenanceMode && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Maintenance active" />
          )}
        </button>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl border border-gray-200 shadow-2xs divide-y divide-gray-100 overflow-hidden"
      >
        {/* TAB 1: General Store Details */}
        {activeTab === "general" && (
          <div>
            <div className="px-4 sm:px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900">Store Profile</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                The public name and contact info displayed on your storefront and customer invoices.
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Store Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Store name
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleInputChange}
                    placeholder="Truvora"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors ${
                      errors.storeName
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                    }`}
                  />
                  {errors.storeName && (
                    <p className="mt-1 text-xs text-red-600">{errors.storeName}</p>
                  )}
                </div>

                {/* Support Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Support email
                  </label>
                  <input
                    type="email"
                    name="supportEmail"
                    value={formData.supportEmail}
                    onChange={handleInputChange}
                    placeholder="support@truvora.com"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors ${
                      errors.supportEmail
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                    }`}
                  />
                  {errors.supportEmail && (
                    <p className="mt-1 text-xs text-red-600">{errors.supportEmail}</p>
                  )}
                </div>

                {/* Support Phone */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Support phone
                  </label>
                  <input
                    type="text"
                    name="supportPhone"
                    value={formData.supportPhone}
                    onChange={handleInputChange}
                    placeholder="+977 9801234567"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B] transition-colors"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Default currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B] bg-white transition-colors"
                  >
                    <option value="NPR (Rs.)">NPR (Rs.) — Nepalese Rupee</option>
                    <option value="USD ($)">USD ($) — US Dollar</option>
                    <option value="INR (₹)">INR (₹) — Indian Rupee</option>
                    <option value="EUR (€)">EUR (€) — Euro</option>
                  </select>
                </div>
              </div>

              {/* Order ID Prefix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Order ID prefix
                  </label>
                  <input
                    type="text"
                    name="orderPrefix"
                    value={formData.orderPrefix}
                    onChange={handleInputChange}
                    placeholder="TRV-"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B] transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Appended before generated order numbers (e.g., {formData.orderPrefix || "TRV-"}10482).
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Store physical address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Kathmandu, Nepal"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Orders & Shipping */}
        {activeTab === "orders" && (
          <div>
            <div className="px-4 sm:px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900">Orders & Shipping Rules</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Set default delivery fees, payment methods, and inventory warning levels.
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Standard Shipping Fee */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Standard delivery fee (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="standardShippingFee"
                    value={formData.standardShippingFee}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors ${
                      errors.standardShippingFee
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                    }`}
                  />
                  {errors.standardShippingFee && (
                    <p className="mt-1 text-xs text-red-600">{errors.standardShippingFee}</p>
                  )}
                </div>

                {/* Free Shipping Threshold */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Free shipping threshold (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="freeShippingThreshold"
                    value={formData.freeShippingThreshold}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors ${
                      errors.freeShippingThreshold
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                    }`}
                  />
                  {errors.freeShippingThreshold && (
                    <p className="mt-1 text-xs text-red-600">{errors.freeShippingThreshold}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Orders at or above this amount automatically receive free shipping.
                  </p>
                </div>

                {/* Low Stock Threshold */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Low stock alert threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none transition-colors ${
                      errors.lowStockThreshold
                        ? "border-red-500 bg-red-50/20"
                        : "border-gray-300 focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B]"
                    }`}
                  />
                  {errors.lowStockThreshold && (
                    <p className="mt-1 text-xs text-red-600">{errors.lowStockThreshold}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Highlights products when stock quantity reaches or drops below this count.
                  </p>
                </div>
              </div>

              {/* Payment Methods Toggles */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Payment Options
                </h3>

                {/* COD Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-900">
                      Cash on Delivery (COD)
                    </span>
                    <span className="block text-xs text-gray-500">
                      Allow customers to pay cash upon doorstep delivery.
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.enableCod}
                    onClick={() => handleToggle("enableCod")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.enableCod ? "bg-[#E6540B]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        formData.enableCod ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Online Payment Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-900">
                      Online Gateway Payments (Khalti / eSewa)
                    </span>
                    <span className="block text-xs text-gray-500">
                      Accept digital wallet and mobile banking payments during checkout.
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.enableOnlinePayment}
                    onClick={() => handleToggle("enableOnlinePayment")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.enableOnlinePayment ? "bg-[#E6540B]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        formData.enableOnlinePayment ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Notifications */}
        {activeTab === "notifications" && (
          <div>
            <div className="px-4 sm:px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900">Admin Notifications</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure when and how you receive alerts about store activity.
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Order Notifications */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <span className="block text-sm font-medium text-gray-900">
                    New order email notifications
                  </span>
                  <span className="block text-xs text-gray-500">
                    Receive an email alert whenever a customer completes a new order.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.orderNotificationsEmail}
                  onClick={() => handleToggle("orderNotificationsEmail")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.orderNotificationsEmail ? "bg-[#E6540B]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formData.orderNotificationsEmail ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Low Stock Alerts */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <span className="block text-sm font-medium text-gray-900">
                    Low stock email warnings
                  </span>
                  <span className="block text-xs text-gray-500">
                    Get alerted when any product drops below your defined low stock threshold.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.lowStockAlertsEmail}
                  onClick={() => handleToggle("lowStockAlertsEmail")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.lowStockAlertsEmail ? "bg-[#E6540B]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formData.lowStockAlertsEmail ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Customer Review Alerts */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <span className="block text-sm font-medium text-gray-900">
                    Customer review alerts
                  </span>
                  <span className="block text-xs text-gray-500">
                    Notify admin when shoppers submit new product ratings and feedback.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.customerReviewAlerts}
                  onClick={() => handleToggle("customerReviewAlerts")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.customerReviewAlerts ? "bg-[#E6540B]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      formData.customerReviewAlerts ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Sound Alerts */}
              <div className="flex items-center justify-between py-3 flex-wrap gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-900">
                    Real-time audio notification chime
                  </span>
                  <span className="block text-xs text-gray-500">
                    Play a gentle chime when real-time socket events (new orders/traffic) arrive.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => playNotificationChime()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
                    title="Play test chime"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-gray-500" />
                    <span>Test chime</span>
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.dashboardSoundAlerts}
                    onClick={() => handleToggle("dashboardSoundAlerts")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.dashboardSoundAlerts ? "bg-[#E6540B]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        formData.dashboardSoundAlerts ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Storefront Status / Maintenance */}
        {activeTab === "maintenance" && (
          <div>
            <div className="px-4 sm:px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900">Storefront Status</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Control customer access during site maintenance or inventory audits.
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Maintenance Toggle */}
              <div
                className={`p-4 rounded-xl border transition-colors ${
                  formData.maintenanceMode
                    ? "bg-amber-50/60 border-amber-200"
                    : "bg-emerald-50/50 border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    {formData.maintenanceMode ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="block text-sm font-semibold text-gray-900">
                        {formData.maintenanceMode
                          ? "Maintenance Mode Active"
                          : "Storefront is Live & Active"}
                      </span>
                      <span className="block text-xs text-gray-600 mt-0.5">
                        {formData.maintenanceMode
                          ? "Shoppers see a maintenance announcement and cannot place orders."
                          : "Your e-commerce storefront is open and accepting new customer orders."}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.maintenanceMode}
                    onClick={() => handleToggle("maintenanceMode")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.maintenanceMode ? "bg-amber-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        formData.maintenanceMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Maintenance Notice Message */}
              {formData.maintenanceMode && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Customer notice message
                  </label>
                  <textarea
                    rows={3}
                    name="maintenanceMessage"
                    value={formData.maintenanceMessage}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E6540B] focus:ring-1 focus:ring-[#E6540B] transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This message will be shown on the storefront while maintenance mode is enabled.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="bg-gray-50/70 px-4 sm:px-6 py-3.5 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            {isDirty ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-700 font-medium">Unsaved changes</span>
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>All changes saved</span>
              </>
            )}
          </span>

          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSaving}
                className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
              >
                Discard
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E6540B] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#d44c0a] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save settings</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Restore Defaults Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Restore default settings?</h3>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              This will reset all store preferences, delivery charges, and notification settings back to factory defaults.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#E6540B] text-white hover:bg-[#d44c0a] cursor-pointer"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
