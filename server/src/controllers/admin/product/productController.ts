import { Request, Response } from "express";
import { col, fn, where as sqlWhere } from "sequelize";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import User from "../../../database/models/userModel";
import getFullImageUrl from "../../../services/imageHandler";
import { cloudinary } from "../../../cloudinary";
import Payment from "../../../database/models/paymentModel";
import Order from "../../../database/models/orderModel";
import OrderDetails from "../../../database/models/orderDetailsModel";
import { getPublicIdFromAvatar } from "../../../services/cloudinaryHelper";
import Review from "../../../database/models/reviewModel";
import { approvedReviewsOnly, formatReviewImages, withPrices } from "../../../services/productPresenter";
import { notifyBackInStock } from "../../../services/notificationService";

const NAME_MIN = 2;
const NAME_MAX = 80;
const DESCRIPTION_MIN = 5;
const DESCRIPTION_MAX = 2000;

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// What every product response includes. The admin's account appears only as a name, never an email.
const productIncludes = [
  { model: Category, attributes: ["id", "categoryName"] },
  { model: User, as: "owner", attributes: ["id", "username"] },
  {
    model: Review,
    as: "reviews",
    where: approvedReviewsOnly,
    required: false,
    attributes: ["id", "rating", "message", "reviewImage", "createdAt"],
    include: [{ model: User, as: "User", attributes: ["id", "username", "avatar"] }],
  },
];

/** API shape: full image URL, visible reviews, and productPrice = what the customer pays */
const present = (product: Product) => {
  const data = product.toJSON();
  return withPrices({
    ...data,
    productImage: data.productImage ? getFullImageUrl(data.productImage) : "",
    reviews: (data.reviews || []).map(formatReviewImages),
  });
};

const newestFirst = (a: { createdAt: Date }, b: { createdAt: Date }) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const destroyImage = async (stored?: string | null) => {
  if (!stored) return;
  try {
    await cloudinary.uploader.destroy(getPublicIdFromAvatar(stored) || stored);
  } catch (error) {
    console.error("Couldn't delete product image from Cloudinary:", error);
  }
};

/** Same name ignoring case and surrounding spaces */
const findByName = (name: string) =>
  Product.findOne({ where: sqlWhere(fn("lower", fn("trim", col("productName"))), name.toLowerCase()) });

type ProductInput = {
  productName: string;
  productDescription: string;
  productPrice: number;
  productStock: number;
  productDiscount: number;
  categoryId: string;
};

/** Reads and checks the form. For updates, fields that weren't sent keep their current value. */
const readInput = (body: Record<string, unknown>, current?: Product): { data: ProductInput } | { message: string; field: string } => {
  const text = (key: string, fallback?: string) => (body[key] === undefined ? fallback ?? "" : String(body[key]).trim());
  const number = (key: string, fallback?: number) =>
    body[key] === undefined || body[key] === "" ? (fallback ?? NaN) : Number(body[key]);

  const productName = text("productName", current?.productName);
  const productDescription = text("productDescription", current?.productDescription);
  const productPrice = number("productPrice", current ? Number(current.productPrice) : undefined);
  const productStock = number("productStock", current?.productStock);
  const productDiscount = number("productDiscount", current?.productDiscount ?? 0);
  const categoryId = text("categoryId", current?.categoryId);

  if (productName.length < NAME_MIN || productName.length > NAME_MAX) {
    return { message: `Product name must be ${NAME_MIN}–${NAME_MAX} characters.`, field: "productName" };
  }
  if (productDescription.length < DESCRIPTION_MIN || productDescription.length > DESCRIPTION_MAX) {
    return { message: `Description must be ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters.`, field: "productDescription" };
  }
  if (!Number.isFinite(productPrice) || productPrice <= 0) {
    return { message: "Price must be more than 0.", field: "productPrice" };
  }
  if (!Number.isInteger(productStock) || productStock < 0) {
    return { message: "Stock must be a whole number of 0 or more.", field: "productStock" };
  }
  if (!Number.isInteger(productDiscount) || productDiscount < 0 || productDiscount > 90) {
    return { message: "Discount must be a whole number from 0 to 90%.", field: "productDiscount" };
  }
  if (!isUuid(categoryId)) {
    return { message: "Choose a category.", field: "categoryId" };
  }
  return { data: { productName, productDescription, productPrice, productStock, productDiscount, categoryId } };
};

class ProductController {
  // *Add Product
  public static async addProduct(req: AuthRequest, res: Response): Promise<void> {
    const uploaded = (req as any).cloudinaryResult;
    // If anything below fails, don't leave the just-uploaded image behind
    const reject = async (status: number, body: { message: string; field: string }) => {
      if (uploaded?.public_id) await destroyImage(uploaded.public_id);
      res.status(status).json(body);
    };

    const userId = req.user?.id;
    if (!userId) {
      await reject(401, { message: "Unauthorized", field: "userId" });
      return;
    }
    if (!req.file || !uploaded?.secure_url) {
      await reject(400, { message: "Please add a product image.", field: "productImage" });
      return;
    }

    const input = readInput(req.body || {});
    if ("message" in input) {
      await reject(400, input);
      return;
    }
    if (await findByName(input.data.productName)) {
      await reject(400, { message: `A product called "${input.data.productName}" already exists.`, field: "productName" });
      return;
    }
    if (!(await Category.findByPk(input.data.categoryId))) {
      await reject(400, { message: "That category no longer exists.", field: "categoryId" });
      return;
    }

    const product = await Product.create({ ...input.data, productImage: uploaded.public_id, userId });
    const saved = await Product.findByPk(product.id, { include: productIncludes });
    res.status(201).json({ message: "Product added", data: present(saved!) });
  }

  // *Fetch All Products (public: the storefront uses this too)
  public static async fetchAllProducts(_req: Request, res: Response): Promise<void> {
    const products = await Product.findAll({ include: productIncludes, order: [["createdAt", "DESC"]] });
    const data = products.map(present).sort(newestFirst);
    res.status(200).json({
      message: data.length ? "Products fetched successfully" : "No products found",
      totalProducts: data.length,
      data,
    });
  }

  // *Fetch Single Product
  public static async fetchSingleProduct(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    // A malformed id can't match any product (and would make Postgres throw a 500)
    const product = isUuid(id) ? await Product.findByPk(id, { include: productIncludes }) : null;
    if (!product) {
      res.status(404).json({ message: "Product not found", field: "general" });
      return;
    }
    res.status(200).json({ message: "Product fetched successfully", data: present(product) });
  }

  // *Fetch Products by Category
  public static async fetchProductsByCategory(req: Request, res: Response): Promise<void> {
    const categoryId = String(req.params.categoryId);
    const products = isUuid(categoryId)
      ? await Product.findAll({ where: { categoryId }, include: productIncludes, order: [["createdAt", "DESC"]] })
      : [];
    if (products.length === 0) {
      res.status(404).json({ message: "No products found for the specified category", field: "general" });
      return;
    }
    const data = products.map(present);
    res.status(200).json({ message: "Category Products fetched successfully", totalProducts: data.length, data });
  }

  // *Fetch Products added by the signed-in admin
  public static async fetchProductsByUser(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ message: "User ID is required", field: "general" });
      return;
    }
    const products = await Product.findAll({ where: { userId }, include: productIncludes, order: [["createdAt", "DESC"]] });
    if (products.length === 0) {
      res.status(404).json({ message: "No products found for the specified user", field: "general" });
      return;
    }
    const data = products.map(present);
    res.status(200).json({ message: "User Products fetched successfully", totalProducts: data.length, data });
  }

  // *Update Product (all fields optional; a new image replaces the old one)
  public static async updateProduct(req: AuthRequest, res: Response): Promise<void> {
    const uploaded = (req as any).cloudinaryResult;
    const reject = async (status: number, body: { message: string; field: string }) => {
      if (uploaded?.public_id) await destroyImage(uploaded.public_id);
      res.status(status).json(body);
    };

    const id = String(req.params.id);
    const product = isUuid(id) ? await Product.findByPk(id) : null;
    if (!product) {
      await reject(404, { message: "Product not found", field: "general" });
      return;
    }

    const input = readInput(req.body || {}, product);
    if ("message" in input) {
      await reject(400, input);
      return;
    }
    const sameName = await findByName(input.data.productName);
    if (sameName && sameName.id !== product.id) {
      await reject(400, { message: `A product called "${input.data.productName}" already exists.`, field: "productName" });
      return;
    }
    if (input.data.categoryId !== product.categoryId && !(await Category.findByPk(input.data.categoryId))) {
      await reject(400, { message: "That category no longer exists.", field: "categoryId" });
      return;
    }

    const wasSoldOut = Number(product.productStock) <= 0;
    const oldImage = product.productImage;
    await product.update({ ...input.data, ...(uploaded?.public_id ? { productImage: uploaded.public_id } : {}) });
    // Only remove the old image once the new one is saved
    if (uploaded?.public_id && oldImage) await destroyImage(oldImage);
    if (wasSoldOut && input.data.productStock > 0) await notifyBackInStock(product);

    const saved = await Product.findByPk(product.id, { include: productIncludes });
    res.status(200).json({ message: "Product updated", data: present(saved!) });
  }

  // *Delete Product (not possible once it's part of an order)
  public static async deleteProduct(req: AuthRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const product = isUuid(id) ? await Product.findByPk(id) : null;
    if (!product) {
      res.status(404).json({ message: "Product not found", field: "general" });
      return;
    }

    const orderLines = await OrderDetails.count({ where: { productId: id } });
    if (orderLines > 0) {
      res.status(400).json({
        message: `"${product.productName}" is in ${orderLines} order${orderLines === 1 ? "" : "s"}, so it can't be deleted. Set its stock to 0 to stop selling it.`,
        field: "general",
      });
      return;
    }

    // Reviews, cart and wishlist entries for it are removed by the database (ON DELETE CASCADE)
    const image = product.productImage;
    await product.destroy();
    await destroyImage(image);
    res.status(200).json({ message: "Product deleted" });
  }

  // *Update Product Stock
  public static async updateProductStock(req: AuthRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const product = isUuid(id) ? await Product.findByPk(id) : null;
    if (!product) {
      res.status(404).json({ message: "Product not found", field: "general" });
      return;
    }

    const stock = Number(req.body?.productStock);
    if (req.body?.productStock === undefined || req.body?.productStock === "" || !Number.isInteger(stock) || stock < 0) {
      res.status(400).json({ message: "Stock must be a whole number of 0 or more.", field: "productStock" });
      return;
    }

    const wasSoldOut = Number(product.productStock) <= 0;
    await product.update({ productStock: stock });
    if (wasSoldOut && stock > 0) await notifyBackInStock(product);

    const saved = await Product.findByPk(id, { include: productIncludes });
    res.status(200).json({ message: "Stock updated", data: present(saved!) });
  }

  // *Orders that include a product (newest first)
  public static async fetchProductOrders(req: AuthRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const product = isUuid(id) ? await Product.findByPk(id, { attributes: ["id", "productName", "productStock"] }) : null;
    if (!product) {
      res.status(404).json({ message: "Product not found", field: "general" });
      return;
    }

    const lines = await OrderDetails.findAll({
      where: { productId: id },
      attributes: ["id", "quantity", "unitPrice"],
      include: [
        {
          model: Order,
          attributes: ["id", "orderStatus", "totalAmount", "shippingAddress", "phoneNumber", "createdAt"],
          include: [
            { model: User, attributes: ["id", "username", "email"] },
            { model: Payment, attributes: ["id", "paymentMethod", "paymentStatus"] },
          ],
        },
      ],
    });
    lines.sort((a: any, b: any) => new Date(b.Order?.createdAt).getTime() - new Date(a.Order?.createdAt).getTime());

    res.status(200).json({
      message: "Product orders fetched successfully",
      totalOrders: lines.length,
      // Same shape as before: [{ ...product, OrderDetails: [...] }]
      data: [{ ...product.toJSON(), OrderDetails: lines.map((line) => line.toJSON()) }],
    });
  }
}

export default ProductController;
