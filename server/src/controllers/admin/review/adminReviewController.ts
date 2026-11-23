import { Request, Response } from "express";
import { Op, WhereOptions, fn, col } from "sequelize";
import Review from "../../../database/models/reviewModel";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import User from "../../../database/models/userModel";
import getFullImageUrl from "../../../services/imageHandler";
import { cloudinary } from "../../../cloudinary";
import { getPublicIdFromAvatar } from "../../../services/cloudinaryHelper";
import fs from "fs";
import path from "path";
import { emitToAdmin } from "../../../services/socketService";
import { notifyCustomer } from "../../../services/notificationService";

// Reviews here are loaded with their Product included
type ReviewWithProduct = { Product?: { productName?: string } };

/**
 * Tell the author when moderation hides their review or makes it visible again.
 * APPROVED = visible to shoppers; PENDING and FLAGGED = hidden. No message if visibility didn't change.
 */
const notifyReviewVisibility = async (
  review: Review,
  previousStatus: string | null,
  newStatus: string,
) => {
  const wasVisible = previousStatus === "APPROVED" || previousStatus === null;
  const isVisible = newStatus === "APPROVED";
  if (wasVisible === isVisible) return;

  const productName = (review as unknown as ReviewWithProduct).Product?.productName ?? "a product";
  await notifyCustomer(
    review.userId,
    isVisible
      ? {
          type: "review-visible",
          title: "Review published",
          message: `Your review of ${productName} is visible again.`,
          link: `/productdetails/${review.productId}#reviews`,
        }
      : {
          type: "review-hidden",
          title: newStatus === "PENDING" ? "Review under review" : "Review hidden",
          message:
            newStatus === "PENDING"
              ? `Your review of ${productName} is being checked by our team and is hidden for now.`
              : `Your review of ${productName} was hidden because it may not follow our review rules.`,
          link: `/productdetails/${review.productId}#reviews`,
        },
  );
};

const REPLY_MAX = 1000;
const isUuid = (id: unknown) =>
  typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
/** Only well-formed ids reach the database (a malformed one makes Postgres throw a 500) */
const validIds = (ids: unknown): string[] => (Array.isArray(ids) ? ids.filter(isUuid) : []);


// ---- List filters (admin Reviews page) ----
const REVIEW_SORTS: Record<string, [string, "ASC" | "DESC"][]> = {
  newest: [["createdAt", "DESC"]],
  oldest: [["createdAt", "ASC"]],
  rating_desc: [["rating", "DESC"], ["createdAt", "DESC"]],
  rating_asc: [["rating", "ASC"], ["createdAt", "DESC"]],
};
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);
// Reviews saved before moderation existed have no status; they count as approved (visible)
const VISIBLE: WhereOptions = { [Op.or]: [{ status: "APPROVED" }, { status: null }] };
const TAB_WHERE: Record<string, WhereOptions> = {
  ALL: {},
  TO_CHECK: { status: { [Op.in]: ["PENDING", "FLAGGED"] } },
  APPROVED: VISIBLE,
  PENDING: { status: "PENDING" },
  FLAGGED: { status: "FLAGGED" },
};
const reviewIncludes = [
  {
    model: Product,
    attributes: ["id", "productName", "productImage", "productPrice"],
    include: [{ model: Category, attributes: ["id", "categoryName"] }],
  },
  { model: User, attributes: ["id", "username", "avatar"] },
];

/** Search, rating and photo filters from the query (the tab is applied separately) */
const reviewFilters = (query: Request["query"]): WhereOptions[] => {
  const conditions: WhereOptions[] = [];
  const search = typeof query.search === "string" ? query.search.trim().slice(0, 100) : "";
  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    conditions.push({
      [Op.or]: [
        { "$User.username$": { [Op.iLike]: pattern } },
        { "$Product.productName$": { [Op.iLike]: pattern } },
        { message: { [Op.iLike]: pattern } },
        { adminReply: { [Op.iLike]: pattern } },
      ],
    });
  }
  const rating = String(query.rating || "").toUpperCase();
  if (rating === "LOW") conditions.push({ rating: { [Op.lte]: 2 } });
  else if (/^[1-5]$/.test(rating)) conditions.push({ rating: Number(rating) });
  if (query.photo === "WITH") conditions.push({ reviewImage: { [Op.ne]: null } });
  if (query.photo === "WITHOUT") conditions.push({ reviewImage: null });
  return conditions;
};

const presentReview = (review: Review) => {
  const plainReview = review.toJSON();
  if (plainReview.reviewImage) plainReview.reviewImage = getFullImageUrl(plainReview.reviewImage);
  if (plainReview.Product && plainReview.Product.productImage) {
    plainReview.Product.productImage = getFullImageUrl(plainReview.Product.productImage);
  }
  if (plainReview.User && plainReview.User.avatar) plainReview.User.avatar = getFullImageUrl(plainReview.User.avatar);
  return plainReview;
};

class AdminReviewController {
  // *Fetch all reviews
  // One page of reviews, with tab counts (following the filters) and numbers for the cards (whole store)
  // Query: tab (ALL|TO_CHECK|APPROVED|PENDING|FLAGGED), search, rating (1-5|LOW), photo (WITH|WITHOUT),
  // sort (newest|oldest|rating_desc|rating_asc), page, limit
  public static async fetchAllReviews(
    req: Request,
    res: Response,
  ): Promise<void> {
    const tab = TAB_WHERE[String(req.query.tab || "").toUpperCase()] ? String(req.query.tab).toUpperCase() : "ALL";
    const sort = REVIEW_SORTS[String(req.query.sort)] ?? REVIEW_SORTS.newest!;
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 10));
    let page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const filters = reviewFilters(req.query);
    const whereFor = (tabKey: string): WhereOptions => ({ [Op.and]: [...filters, TAB_WHERE[tabKey]!] });
    // Joined tables are only needed to search by customer or product name
    const countIncludes = [
      { model: Product, attributes: [] },
      { model: User, attributes: [] },
    ];
    const countFor = (tabKey: string) =>
      Review.count({ where: whereFor(tabKey), include: countIncludes, distinct: true, col: "id" });

    const tabKeys = Object.keys(TAB_WHERE);
    const [tabTotals, total, visible, toCheck, lowRated, average] = await Promise.all([
      Promise.all(tabKeys.map(countFor)),
      Review.count(),
      Review.count({ where: VISIBLE }),
      Review.count({ where: TAB_WHERE.TO_CHECK! }),
      Review.count({ where: { rating: { [Op.lte]: 2 } } }),
      Review.findOne({ where: VISIBLE, attributes: [[fn("AVG", col("rating")), "avg"]], raw: true }) as unknown as Promise<{ avg: string | null } | null>,
    ]);
    const counts = Object.fromEntries(tabKeys.map((key, i) => [key, tabTotals[i]]));

    const matching = counts[tab] ?? 0;
    const totalPages = Math.max(1, Math.ceil(matching / limit));
    page = Math.min(page, totalPages);

    const rows = await Review.findAll({
      where: whereFor(tab),
      include: reviewIncludes,
      order: [...sort, ["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
      subQuery: false,
    });

    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: rows.map(presentReview),
      total: matching,
      totalPages,
      currentPage: page,
      counts,
      // Average over visible reviews only: the same rating shoppers see in the store
      stats: { total, visible, toCheck, lowRated, averageRating: average?.avg ? Number(average.avg) : 0 },
    });
  }

  // *Delete Review
  public static async deleteReview(req: Request, res: Response): Promise<void> {
    const reviewId = req.params.id;
    if (!reviewId) {
      res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
      return;
    }

    const review = isUuid(reviewId) ? await Review.findByPk(reviewId as string) : null;
    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    if (review.reviewImage) {
      const fileName = getPublicIdFromAvatar(review.reviewImage);
      if (fileName && fileName.includes("Mern3_Ecommerce_Images")) {
        cloudinary.uploader.destroy(fileName, (error: any, result: any) => {
          if (error)
            console.error("Error deleting image from Cloudinary:", error);
          else
            console.log("Image deleted from Cloudinary successfully:", result);
        });
      }

      const localFilePath = path.join(process.cwd(), "src", "storage", review.reviewImage);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (e) {
          console.error("Error deleting local review image:", e);
        }
      }
    }

    await review.destroy();

    emitToAdmin("admin:dashboard-refresh", {
      type: "review-deleted",
      reviewId,
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  }

  // *Update Review Status (APPROVED, PENDING, FLAGGED)
  public static async updateReviewStatus(
    req: Request,
    res: Response,
  ): Promise<void> {
    const reviewId = req.params.id;
    const { status } = req.body;

    const validStatuses = ["APPROVED", "PENDING", "FLAGGED"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Valid status ('APPROVED', 'PENDING', 'FLAGGED') is required",
      });
      return;
    }

    const review = !isUuid(reviewId) ? null : await Review.findByPk(reviewId as string, {
      include: [
        {
          model: Product,
          attributes: ["id", "productName", "productImage", "productPrice"],
          include: [
            {
              model: Category,
              attributes: ["id", "categoryName"],
            },
          ],
        },
        {
          model: User,
          attributes: ["id", "username", "avatar"],
        },
      ],
    });

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    const previousStatus = review.status;
    review.status = status;
    await review.save();

    await notifyReviewVisibility(review, previousStatus, status);

    const plainReview = review.toJSON();
    if (plainReview.reviewImage) {
      plainReview.reviewImage = getFullImageUrl(plainReview.reviewImage);
    }
    if (plainReview.Product && plainReview.Product.productImage) {
      plainReview.Product.productImage = getFullImageUrl(plainReview.Product.productImage);
    }
    if (plainReview.User && plainReview.User.avatar) {
      plainReview.User.avatar = getFullImageUrl(plainReview.User.avatar);
    }

    emitToAdmin("admin:dashboard-refresh", {
      type: "review-status-updated",
      reviewId,
      status,
    });

    res.status(200).json({
      success: true,
      message: `Review marked as ${status}`,
      data: plainReview,
    });
  }

  // *Add or Update Admin Reply
  public static async replyToReview(
    req: Request,
    res: Response,
  ): Promise<void> {
    const reviewId = req.params.id;
    const { adminReply } = req.body;

    const review = !isUuid(reviewId) ? null : await Review.findByPk(reviewId as string, {
      include: [
        {
          model: Product,
          attributes: ["id", "productName", "productImage", "productPrice"],
          include: [
            {
              model: Category,
              attributes: ["id", "categoryName"],
            },
          ],
        },
        {
          model: User,
          attributes: ["id", "username", "avatar"],
        },
      ],
    });

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Review not found",
      });
      return;
    }

    if (typeof adminReply === "string" && adminReply.trim().length > REPLY_MAX) {
      res.status(400).json({ success: false, message: `Replies can be up to ${REPLY_MAX} characters.` });
      return;
    }

    const hadReply = !!review.adminReply;
    if (!adminReply || typeof adminReply !== "string" || adminReply.trim() === "") {
      review.adminReply = null;
      review.repliedAt = null;
    } else {
      review.adminReply = adminReply.trim();
      review.repliedAt = new Date();
    }

    await review.save();

    // New or changed reply -> let the reviewer know
    if (review.adminReply) {
      const productName = (review as unknown as ReviewWithProduct).Product?.productName ?? "a product";
      const reply = review.adminReply;
      await notifyCustomer(review.userId, {
        type: "review-reply",
        title: hadReply ? "Store reply updated" : "The store replied to your review",
        message: `On ${productName}: "${reply.length > 120 ? `${reply.slice(0, 120)}…` : reply}"`,
        link: `/productdetails/${review.productId}#reviews`,
      });
    }

    const plainReview = review.toJSON();
    if (plainReview.reviewImage) {
      plainReview.reviewImage = getFullImageUrl(plainReview.reviewImage);
    }
    if (plainReview.Product && plainReview.Product.productImage) {
      plainReview.Product.productImage = getFullImageUrl(plainReview.Product.productImage);
    }
    if (plainReview.User && plainReview.User.avatar) {
      plainReview.User.avatar = getFullImageUrl(plainReview.User.avatar);
    }

    res.status(200).json({
      success: true,
      message: review.adminReply
        ? "Official response posted successfully"
        : "Response cleared successfully",
      data: plainReview,
    });
  }

  // *Bulk Update Status
  public static async bulkUpdateReviewStatus(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { status } = req.body;
    const reviewIds = validIds(req.body?.reviewIds);

    const validStatuses = ["APPROVED", "PENDING", "FLAGGED"];
    if (reviewIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "reviewIds must be a non-empty array of IDs",
      });
      return;
    }

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Valid status ('APPROVED', 'PENDING', 'FLAGGED') is required",
      });
      return;
    }

    // Remember each review's current status so authors can be told about visibility changes
    const before = await Review.findAll({
      where: { id: reviewIds },
      include: [{ model: Product, attributes: ["id", "productName"] }],
    });

    const [updatedCount] = await Review.update(
      { status },
      {
        where: {
          id: reviewIds,
        },
      },
    );

    for (const review of before) {
      await notifyReviewVisibility(review, review.status, status);
    }

    emitToAdmin("admin:dashboard-refresh", {
      type: "review-bulk-updated",
      reviewIds,
      status,
    });

    res.status(200).json({
      success: true,
      message: `${updatedCount} review${updatedCount === 1 ? "" : "s"} marked as ${status.toLowerCase()}`,
    });
  }

  // *Bulk Delete Reviews
  public static async bulkDeleteReviews(
    req: Request,
    res: Response,
  ): Promise<void> {
    const reviewIds = validIds(req.body?.reviewIds);

    if (reviewIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "reviewIds must be a non-empty array of IDs",
      });
      return;
    }

    const reviews = await Review.findAll({
      where: {
        id: reviewIds,
      },
    });

    for (const r of reviews) {
      if (r.reviewImage) {
        const fileName = getPublicIdFromAvatar(r.reviewImage);
        if (fileName && fileName.includes("Mern3_Ecommerce_Images")) {
          cloudinary.uploader.destroy(fileName, (error: any) => {
            if (error) console.error("Error deleting image from Cloudinary:", error);
          });
        }

        const localFilePath = path.join(process.cwd(), "src", "storage", r.reviewImage);
        if (fs.existsSync(localFilePath)) {
          try {
            fs.unlinkSync(localFilePath);
          } catch (e) {
            console.error("Error deleting local review image:", e);
          }
        }
      }
    }

    const deletedCount = await Review.destroy({
      where: {
        id: reviewIds,
      },
    });

    emitToAdmin("admin:dashboard-refresh", {
      type: "review-bulk-deleted",
      reviewIds,
    });

    res.status(200).json({
      success: true,
      message: `${deletedCount} review${deletedCount === 1 ? "" : "s"} deleted`,
    });
  }
}

export default AdminReviewController;
