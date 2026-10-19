import Notification from "../database/models/notificationModel";
import Wishlist from "../database/models/wishlistModel";
import { emitToAdmin, emitToUser } from "./socketService";
import { getStoreSettings } from "./storeSettingsService";
import { describeDiscount, findWelcomeCoupon } from "./couponService";

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
    const saved = await Notification.create({ audience: "admin", userId: null, ...input });
    emitToAdmin("notification:new", saved.toJSON());
  } catch (error) {
    console.error("Failed to create admin notification:", error);
  }
};
