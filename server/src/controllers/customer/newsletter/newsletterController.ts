import crypto from "crypto";
import { Op, WhereOptions } from "sequelize";
import { Request, Response } from "express";
import NewsletterSubscriber, { SubscriberStatus } from "../../../database/models/newsletterSubscriberModel";
import { notifyAdmins } from "../../../services/notificationService";
import { emitToAdmin } from "../../../services/socketService";
import {
  sendConfirmSubscriptionEmail,
  sendWelcomeEmail,
} from "../../../services/newsletterEmails";

const CONFIRM_LINK_HOURS = 48;

const isUuid = (id: unknown) =>
  typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const SUBSCRIBER_TABS: SubscriberStatus[] = ["CONFIRMED", "PENDING", "UNSUBSCRIBED"];
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

/** Sign-ups that never confirmed and whose link no longer works */
const expiredPendingWhere = (): WhereOptions => ({
  status: "PENDING",
  [Op.or]: [{ confirmTokenExpiresAt: null }, { confirmTokenExpiresAt: { [Op.lt]: new Date() } }],
});

/** Search and "confirmed in the last 30 days" filters shared by the list and the export */
const listFilters = (req: Request) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase().slice(0, 100) : "";
  const searchWhere: WhereOptions = search ? { email: { [Op.iLike]: `%${escapeLike(search)}%` } } : {};
  return { searchWhere, recent: req.query.recent === "true" };
};

/** Lets the admin Subscribers page refresh itself */
const listChanged = () => emitToAdmin("admin:newsletter-changed");

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

    listChanged();
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
    listChanged();
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
      listChanged();
    }

    res.status(200).json({
      message: "You've been unsubscribed and won't receive our newsletter anymore.",
      email: subscriber.email,
    });
  }

  // *One page of subscribers with tab counts and card numbers (admin)
  // Query: tab (ALL|CONFIRMED|PENDING|UNSUBSCRIBED), recent=true (confirmed in the last 30 days),
  // search (part of the email), sort (newest|oldest), page, limit
  public static async fetchSubscribers(req: Request, res: Response): Promise<void> {
    const tab = SUBSCRIBER_TABS.includes(String(req.query.tab) as SubscriberStatus) ? (String(req.query.tab) as SubscriberStatus) : null;
    const { searchWhere, recent } = listFilters(req);
    const order = req.query.sort === "oldest" ? "ASC" : "DESC";
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 10));
    let page = Math.max(1, parseInt(String(req.query.page)) || 1);

    // "Recent" only means anything for confirmed people
    const pageWhere: WhereOptions = recent
      ? { ...searchWhere, status: "CONFIRMED", confirmedAt: { [Op.gte]: daysAgo(30) } }
      : tab
        ? { ...searchWhere, status: tab }
        : searchWhere;

    const now = new Date();
    const [total, grouped, confirmed, new30, new7, pending, expired, unsubscribed] = await Promise.all([
      NewsletterSubscriber.count({ where: pageWhere }),
      NewsletterSubscriber.count({ where: searchWhere, group: ["status"] }) as unknown as Promise<{ status: string; count: number }[]>,
      NewsletterSubscriber.count({ where: { status: "CONFIRMED" } }),
      NewsletterSubscriber.count({ where: { status: "CONFIRMED", confirmedAt: { [Op.gte]: daysAgo(30) } } }),
      NewsletterSubscriber.count({ where: { status: "CONFIRMED", confirmedAt: { [Op.gte]: daysAgo(7) } } }),
      NewsletterSubscriber.count({ where: { status: "PENDING" } }),
      NewsletterSubscriber.count({ where: expiredPendingWhere() }),
      NewsletterSubscriber.count({ where: { status: "UNSUBSCRIBED" } }),
    ]);

    // A page past the end (e.g. after removing the last row on it) falls back to the last page
    const totalPages = Math.max(1, Math.ceil(total / limit));
    page = Math.min(page, totalPages);

    const rows = await NewsletterSubscriber.findAll({
      where: pageWhere,
      attributes: ["id", "email", "status", "createdAt", "confirmedAt", "unsubscribedAt", "confirmTokenExpiresAt"],
      order: [["createdAt", order], ["id", order]],
      limit,
      offset: (page - 1) * limit,
    });

    const counts: Record<string, number> = { CONFIRMED: 0, PENDING: 0, UNSUBSCRIBED: 0 };
    for (const g of grouped) counts[g.status] = Number(g.count);
    counts.ALL = grouped.reduce((sum, g) => sum + Number(g.count), 0);

    res.status(200).json({
      message: "Subscribers fetched successfully",
      // Pending sign-ups show when their confirmation link expires (the token itself stays private)
      data: rows.map((s) => {
        const { confirmTokenExpiresAt, ...rest } = s.toJSON();
        const pendingRow = rest.status === "PENDING";
        return {
          ...rest,
          confirmLinkExpiresAt: pendingRow ? confirmTokenExpiresAt : null,
          linkExpired: pendingRow && (!confirmTokenExpiresAt || new Date(confirmTokenExpiresAt) < now),
        };
      }),
      total,
      totalPages,
      currentPage: page,
      counts,
      stats: { confirmed, new30, new7, pending, expired, unsubscribed },
    });
  }

  // *Confirmed emails matching the search (for Copy and Export CSV) (admin)
  public static async exportSubscribers(req: Request, res: Response): Promise<void> {
    const { searchWhere, recent } = listFilters(req);
    const rows = await NewsletterSubscriber.findAll({
      where: {
        ...searchWhere,
        status: "CONFIRMED",
        ...(recent ? { confirmedAt: { [Op.gte]: daysAgo(30) } } : {}),
      },
      attributes: ["email", "confirmedAt"],
      order: [["confirmedAt", "DESC"]],
    });
    res.status(200).json({ message: "Confirmed subscribers", data: rows });
  }

  // *Stop sending emails to someone but keep the record (e.g. they asked by email or phone) (admin)
  public static async adminUnsubscribe(req: Request, res: Response): Promise<void> {
    const subscriber = isUuid(req.params.id) ? await NewsletterSubscriber.findByPk(req.params.id as string) : null;
    if (!subscriber) {
      res.status(404).json({ message: "Subscriber not found", field: "id" });
      return;
    }
    if (subscriber.status !== "UNSUBSCRIBED") {
      subscriber.status = "UNSUBSCRIBED";
      subscriber.unsubscribedAt = new Date();
      subscriber.confirmTokenHash = null;
      subscriber.confirmTokenExpiresAt = null;
      await subscriber.save();
      listChanged();
    }
    res.status(200).json({ message: `${subscriber.email} won't get newsletter emails anymore.` });
  }

  // *Remove a subscriber (admin)
  public static async deleteSubscriber(req: Request, res: Response): Promise<void> {
    const deleted = isUuid(req.params.id)
      ? await NewsletterSubscriber.destroy({ where: { id: req.params.id as string } })
      : 0;
    if (!deleted) {
      res.status(404).json({ message: "Subscriber not found", field: "id" });
      return;
    }
    listChanged();
    res.status(200).json({ message: "Subscriber removed" });
  }

  // *Remove sign-ups that never confirmed and whose link has expired (admin)
  public static async deleteExpiredPending(req: Request, res: Response): Promise<void> {
    const deleted = await NewsletterSubscriber.destroy({ where: expiredPendingWhere() });
    if (deleted) listChanged();
    res.status(200).json({
      message: deleted
        ? `Removed ${deleted} expired sign-up${deleted === 1 ? "" : "s"}`
        : "No expired sign-ups to remove",
      deleted,
    });
  }
}

export default NewsletterController;
