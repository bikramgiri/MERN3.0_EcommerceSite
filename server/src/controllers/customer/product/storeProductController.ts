import { Request, Response } from "express";
import { Op, literal, where as sqlWhere, type Order, type WhereOptions } from "sequelize";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import Review from "../../../database/models/reviewModel";
import User from "../../../database/models/userModel";
import getFullImageUrl from "../../../services/imageHandler";
import { approvedReviewsOnly, formatReviewImages } from "../../../services/productPresenter";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Average rating / number of shopper-visible reviews, computed in the database
const visibleReviews = `FROM "reviews" AS r WHERE r."productId" = "Product"."id" AND (r."status" = 'APPROVED' OR r."status" IS NULL)`;
const AVG_RATING = literal(`(SELECT COALESCE(AVG(r."rating"), 0) ${visibleReviews})`);
const REVIEW_COUNT = literal(`(SELECT COUNT(*) ${visibleReviews})`);

const SORTS: Record<string, Order> = {
  relevance: [[AVG_RATING, "DESC"], [REVIEW_COUNT, "DESC"]],
  newest: [["createdAt", "DESC"]],
  price_asc: [["productPrice", "ASC"]],
  price_desc: [["productPrice", "DESC"]],
  rating_high: [[AVG_RATING, "DESC"], [REVIEW_COUNT, "DESC"]],
  popular: [[REVIEW_COUNT, "DESC"], [AVG_RATING, "DESC"]],
};

const toNumber = (value: unknown) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

// Treat % and _ typed by the shopper as plain characters in LIKE patterns
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

class StoreProductController {
  /**
   * Public product listing with search, filters, sorting and pagination done in the database.
   * Query: search, category, minPrice, maxPrice, minRating, sort, page, limit
   */
  public static async listProducts(req: Request, res: Response): Promise<void> {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const category = typeof req.query.category === "string" ? req.query.category : "";
    const minPrice = toNumber(req.query.minPrice);
    const maxPrice = toNumber(req.query.maxPrice);
    const minRating = toNumber(req.query.minRating);
    const sortKey = typeof req.query.sort === "string" && SORTS[req.query.sort] ? req.query.sort : "relevance";
    const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(toNumber(req.query.limit) ?? DEFAULT_LIMIT)));
    const requestedPage = Math.max(1, Math.floor(toNumber(req.query.page) ?? 1));

    // A malformed category id can't match anything (and would make Postgres throw)
    if (category && category !== "all" && !UUID_PATTERN.test(category)) {
      res.status(200).json({ message: "Products fetched successfully", data: [], total: 0, page: 1, limit, totalPages: 1 });
      return;
    }

    const conditions: WhereOptions[] = [];
    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      conditions.push({
        [Op.or]: [
          { productName: { [Op.iLike]: pattern } },
          { "$category.categoryName$": { [Op.iLike]: pattern } },
        ],
      });
    }
    if (category && category !== "all") conditions.push({ categoryId: category });
    if (minPrice !== undefined) conditions.push({ productPrice: { [Op.gte]: minPrice } });
    if (maxPrice !== undefined) conditions.push({ productPrice: { [Op.lte]: maxPrice } });
    if (minRating !== undefined && minRating > 0) conditions.push(sqlWhere(AVG_RATING, Op.gte, minRating));

    const where: WhereOptions = conditions.length ? { [Op.and]: conditions } : {};
    const categoryJoin = { model: Category, attributes: [], required: false };

    const total = await Product.count({ where, include: [categoryJoin], distinct: true, col: "id" });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);

    // When searching in "Recommended" order, products whose own name matches come first
    // (ahead of products that only match through their category name)
    const nameMatchFirst =
      search && sortKey === "relevance"
        ? [[literal(`CASE WHEN "Product"."productName" ILIKE ${Product.sequelize!.escape(`%${escapeLike(search)}%`)} THEN 0 ELSE 1 END`), "ASC"]]
        : [];

    // 1) Find the ids for this page in the right order (stable thanks to the id tie-breaker)
    const pageRows = await Product.findAll({
      attributes: ["id"],
      where,
      include: [categoryJoin],
      order: [...nameMatchFirst, ...(SORTS[sortKey] as unknown[]), ["id", "ASC"]] as Order,
      limit,
      offset: (page - 1) * limit,
      subQuery: false,
    });
    const ids = pageRows.map((row) => row.id);

    // 2) Load full details only for those products
    const products = ids.length
      ? await Product.findAll({
          where: { id: ids },
          include: [
            { model: Category, attributes: ["id", "categoryName"] },
            {
              model: Review,
              as: "reviews",
              where: approvedReviewsOnly,
              required: false,
              attributes: ["id", "rating", "message", "reviewImage", "createdAt"],
              include: [{ model: User, as: "User", attributes: ["id", "username", "avatar"] }],
            },
          ],
        })
      : [];

    const byId = new Map<string, any>(products.map((p) => [p.id, p.toJSON()]));
    const data = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p) => ({
        ...p,
        productImage: getFullImageUrl(p.productImage),
        reviews: (p.reviews || []).map(formatReviewImages),
      }));

    res.status(200).json({ message: "Products fetched successfully", data, total, page, limit, totalPages });
  }
}

export default StoreProductController;
