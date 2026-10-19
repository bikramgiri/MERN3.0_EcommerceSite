import crypto from "crypto";
import { Request, Response } from "express";
import NewsletterSubscriber from "../../../database/models/newsletterSubscriberModel";
import { notifyAdmins } from "../../../services/notificationService";
import {
  sendConfirmSubscriptionEmail,
  sendWelcomeEmail,
} from "../../../services/newsletterEmails";

const CONFIRM_LINK_HOURS = 48;

const randomToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const readToken = (req: Request) => {
  const token = req.query.token ?? req.body?.token;
  return typeof token === "string" && /^[a-f0-9]{32,128}$/i.test(token) ? token : "";
};

class NewsletterController {
  // *Start a subscription: save as PENDING and email a confirmation link (no login required)
  public static async subscribe(req: Request, res: Response): Promise<void> {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        message: "Please enter a valid email address",
        field: "email",
      });
      return;
    }

    const existing = await NewsletterSubscriber.findOne({ where: { email } });
    if (existing?.status === "CONFIRMED") {
      res.status(200).json({ message: "You're already subscribed." });
      return;
    }

    // New, still pending, or previously unsubscribed: (re)send a fresh confirmation link
    const confirmToken = randomToken();
    const subscriber = existing ?? NewsletterSubscriber.build({ email });
    subscriber.status = "PENDING";
    subscriber.confirmTokenHash = hashToken(confirmToken);
    subscriber.confirmTokenExpiresAt = new Date(
      Date.now() + CONFIRM_LINK_HOURS * 60 * 60 * 1000,
    );
    subscriber.unsubscribeToken = subscriber.unsubscribeToken || randomToken();
    await subscriber.save();

    try {
      await sendConfirmSubscriptionEmail(email, confirmToken, CONFIRM_LINK_HOURS);
    } catch (error) {
      console.error("Newsletter confirmation email failed:", error);
      res.status(502).json({
        message: "We couldn't send the confirmation email. Please try again later.",
        field: "email",
      });
      return;
    }

    res.status(existing ? 200 : 201).json({
      message: "Almost done! Check your inbox and click the link to confirm your subscription.",
    });
  }

  // *Confirm a subscription from the emailed link, then send the welcome email
  public static async confirm(req: Request, res: Response): Promise<void> {
    const token = readToken(req);
    const subscriber = token
      ? await NewsletterSubscriber.findOne({
          where: { confirmTokenHash: hashToken(token) },
        })
      : null;

    if (
      !subscriber ||
      !subscriber.confirmTokenExpiresAt ||
      subscriber.confirmTokenExpiresAt.getTime() < Date.now()
    ) {
      res.status(400).json({
        message: "This confirmation link is invalid or has expired. Please subscribe again.",
        field: "token",
      });
      return;
    }

    // Clicking the link twice (or a mail app opening it first) shouldn't show an error
    if (subscriber.status === "CONFIRMED") {
      res.status(200).json({
        message: "Your subscription is already confirmed.",
        email: subscriber.email,
        alreadyConfirmed: true,
      });
      return;
    }

    // The token stays valid until it expires so repeat clicks hit the branch above
    subscriber.status = "CONFIRMED";
    subscriber.confirmedAt = new Date();
    subscriber.unsubscribedAt = null;
    subscriber.unsubscribeToken = subscriber.unsubscribeToken || randomToken();
    await subscriber.save();

    // The subscription is already active; a failed welcome email shouldn't undo it
    sendWelcomeEmail(subscriber.email, subscriber.unsubscribeToken!).catch((error) =>
      console.error("Newsletter welcome email failed:", error),
    );
    await notifyAdmins({
      type: "new-subscriber",
      title: "New newsletter subscriber",
      message: `${subscriber.email} confirmed their newsletter subscription.`,
      link: "/admin-dashboard/subscribers",
    });

    res.status(200).json({
      message: "Your subscription is confirmed. Welcome aboard!",
      email: subscriber.email,
    });
  }

  // *Unsubscribe via the email link or the mail app's one-click button (RFC 8058)
  public static async unsubscribe(req: Request, res: Response): Promise<void> {
    const token = readToken(req);
    const subscriber = token
      ? await NewsletterSubscriber.findOne({ where: { unsubscribeToken: token } })
      : null;

    if (!subscriber) {
      res.status(400).json({
        message: "This unsubscribe link is invalid.",
        field: "token",
      });
      return;
    }

    if (subscriber.status !== "UNSUBSCRIBED") {
      subscriber.status = "UNSUBSCRIBED";
      subscriber.unsubscribedAt = new Date();
      subscriber.confirmTokenHash = null;
      subscriber.confirmTokenExpiresAt = null;
      await subscriber.save();
    }

    res.status(200).json({
      message: "You've been unsubscribed and won't receive our newsletter anymore.",
      email: subscriber.email,
    });
  }

  // *All subscribers, newest first (admin)
  public static async fetchSubscribers(req: Request, res: Response): Promise<void> {
    const subscribers = await NewsletterSubscriber.findAll({
      attributes: ["id", "email", "status", "createdAt", "confirmedAt", "unsubscribedAt"],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      message: "Subscribers fetched successfully",
      totalSubscribers: subscribers.length,
      data: subscribers,
    });
  }

  // *Remove a subscriber (admin)
  public static async deleteSubscriber(req: Request, res: Response): Promise<void> {
    const deleted = await NewsletterSubscriber.destroy({
      where: { id: req.params.id },
    });
    if (!deleted) {
      res.status(404).json({ message: "Subscriber not found", field: "id" });
      return;
    }
    res.status(200).json({ message: "Subscriber removed" });
  }
}

export default NewsletterController;
