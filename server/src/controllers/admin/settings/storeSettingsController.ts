import { Request, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import {
  getPublicStoreSettings,
  getStoreSettings,
  updateStoreSettings,
  validateSettingsUpdate,
} from "../../../services/storeSettingsService";
import { emitToAll } from "../../../services/socketService";

class StoreSettingsController {
  // *Settings shoppers need (shipping, payment options, maintenance, contact)
  public static async fetchPublicSettings(
    req: Request,
    res: Response,
  ): Promise<void> {
    const settings = await getPublicStoreSettings();
    res.status(200).json({
      message: "Store settings fetched successfully",
      data: settings,
    });
  }

  // *All settings, for the admin settings page
  public static async fetchAdminSettings(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const settings = await getStoreSettings();
    res.status(200).json({
      message: "Store settings fetched successfully",
      data: settings,
    });
  }

  // *Update settings and push the public part to every open storefront
  public static async updateSettings(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const { data, error } = validateSettingsUpdate(req.body || {});
    if (error) {
      res.status(400).json(error);
      return;
    }

    // Shoppers need at least one way to pay
    const current = await getStoreSettings();
    const codOn = data.enableCod ?? current.enableCod;
    const onlineOn = data.enableOnlinePayment ?? current.enableOnlinePayment;
    if (!codOn && !onlineOn) {
      res.status(400).json({
        field: "enableCod",
        message: "Keep at least one payment method on (cash on delivery or online payment), or turn on maintenance mode to pause orders.",
      });
      return;
    }

    const settings = await updateStoreSettings(data, req.user?.id ?? null);
    emitToAll("store:settings-updated", await getPublicStoreSettings());

    res.status(200).json({
      message: "Settings saved successfully",
      data: settings,
    });
  }
}

export default StoreSettingsController;
