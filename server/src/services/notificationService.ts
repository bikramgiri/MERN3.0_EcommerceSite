import Notification from "../database/models/notificationModel";
import Wishlist from "../database/models/wishlistModel";
import { emitToAdmin, emitToUser } from "./socketService";
import { getStoreSettings } from "./storeSettingsService";
import { describeDiscount, findWelcomeCoupon } from "./couponService";
import User from "../database/models/userModel";
import { sendMail } from "./sendMail";
import { envConfig } from "../config/config";

// Admin alerts that the Settings > Notifications switches control
const EMAIL_SETTING_BY_TYPE: Record<string, "orderNotificationsEmail" | "lowStockAlertsEmail"> = {
  "new-order": "orderNotificationsEmail",
  "low-stock": "lowStockAlertsEmail",
  "out-of-stock": "lowStockAlertsEmail",
};
const SOUND_TYPES = new Set(["new-order", "new-review", "low-stock", "out-of-stock"]);

/** Emails every admin account about an alert (in the background; a failed email is only logged) */
const emailAdmins = async (storeName: string, input: NotifyInput) => {
  const admins = await User.findAll({ where: { role: "admin", isBlocked: false }, attributes: ["email"] });
  const link = input.link ? `\n\nOpen: ${(envConfig.clientUrl || "").replace(/\/$/, "")}${input.link}` : "";
  await Promise.allSettled(
    admins.map((admin) =>
      sendMail({ to: admin.email, subject: `[${storeName}] ${input.title}`, text: `${input.message}${link}` }),
    ),
  );
};

interface NotifyInput {
  type: string;
  title: string;
  message: string;
  link?: string | null;
}

/** Short, readable order number like "TRV-3f2a1c" (same format the admin panel shows) */
export const orderLabel = async (orderId: string) => {
  const { orderPrefix } = await getStoreSettings();
  return `${orderPrefix || "#"}${String(orderId).slice(-6)}`;
};

/**
 * Save a notification for one customer and push it to their open tabs instantly.
 * Never throws: a failed notification must not break the action that triggered it.
 */
export const notifyCustomer = async (userId: string | null | undefined, input: NotifyInput) => {
  if (!userId) return;
  try {
    const saved = await Notification.create({ audience: "customer", userId, ...input });
    emitToUser(userId, "notification:new", saved.toJSON());
  } catch (error) {
    console.error("Failed to create customer notification:", error);
  }
};

/** A sold-out product is available again: tell everyone who has it in their wishlist */
export const notifyBackInStock = async (product: { id: string; productName: string }) => {
  try {
    const wishlisted = await Wishlist.findAll({ where: { productId: product.id }, attributes: ["userId"] });
    for (const { userId } of wishlisted) {
      await notifyCustomer(userId, {
        type: "back-in-stock",
        title: "Back in stock",
        message: `${product.productName} from your wishlist is available again.`,
        link: `/productdetails/${product.id}`,
      });
    }
  } catch (error) {
    console.error("Failed to send back-in-stock notifications:", error);
  }
};

/** New sign-up: welcome the customer and let the admin team know */
export const notifyNewCustomer = async (
  userId: string,
  username: string,
  email: string,
  method: "email" | "Google",
) => {
  // Mention the new-customer offer, if the store has one switched on
  let offer = "";
  try {
    const coupon = await findWelcomeCoupon();
    if (coupon) {
      offer = ` New here? Use ${coupon.code} for ${describeDiscount(coupon)}${coupon.firstOrderOnly ? " on your first order" : ""}.`;
    }
  } catch {
    // the welcome message still goes out without the offer
  }
  await notifyCustomer(userId, {
    type: "welcome",
    title: "Welcome to the store!",
    message: `Your account is ready. Browse our products and add your favourites to the wishlist.${offer}`,
    link: "/products",
  });
  await notifyAdmins({
    type: "new-customer",
    title: "New customer",
    message: `${username} (${email}) signed up with ${method}.`,
    link: "/admin-dashboard/users",
  });
};

/** Save a notification for the admin team and push it to every connected admin. */
export const notifyAdmins = async (input: NotifyInput) => {
  try {
    const settings = await getStoreSettings();
    // "Customer review alerts" off: new reviews don't create alerts (they still appear on the Reviews page)
    if (input.type === "new-review" && !settings.customerReviewAlerts) return;

    const saved = await Notification.create({ audience: "admin", userId: null, ...input });
    // playSound tells open dashboards to chime ("Dashboard sound alerts")
    emitToAdmin("notification:new", {
      ...saved.toJSON(),
      playSound: settings.dashboardSoundAlerts && SOUND_TYPES.has(input.type),
    });

    const emailSetting = EMAIL_SETTING_BY_TYPE[input.type];
    if (emailSetting && settings[emailSetting]) {
      emailAdmins(settings.storeName || "Truvora", input).catch((error) =>
        console.error("Failed to email admins:", error),
      );
    }
  } catch (error) {
    console.error("Failed to create admin notification:", error);
  }
};
