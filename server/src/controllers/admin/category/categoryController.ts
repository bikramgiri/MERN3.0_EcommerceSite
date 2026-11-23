import { Request, Response } from "express";
import { Op, Sequelize, where as sqlWhere, fn, col } from "sequelize";
import Category from "../../../database/models/categoryModel";
import getFullImageUrl from "../../../services/imageHandler";
import { cloudinary } from "../../../cloudinary";
import { getPublicIdFromAvatar } from "../../../services/cloudinaryHelper";
import Product from "../../../database/models/productModel";
import { sequelize } from "../../../database/connection";

const NAME_MIN = 2;
const NAME_MAX = 40;
const DESCRIPTION_MIN = 5;
const DESCRIPTION_MAX = 200;

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Number of products in each category, counted by the database
const productCount: [ReturnType<typeof Sequelize.literal>, string] = [
  Sequelize.literal(`(SELECT COUNT(*) FROM "products" p WHERE p."categoryId" = "Category"."id")`),
  "totalProducts",
];

const present = (category: Category) => {
  const plain = category.toJSON();
  return {
    ...plain,
    categoryImage: plain.categoryImage ? getFullImageUrl(plain.categoryImage) : "",
    totalProducts: Number(plain.totalProducts) || 0,
  };
};

/** Removes an image from Cloudinary without failing the request if that doesn't work */
const destroyImage = async (stored?: string | null) => {
  if (!stored) return;
  const publicId = getPublicIdFromAvatar(stored) || stored;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Couldn't delete category image from Cloudinary:", error);
  }
};

/** Same name ignoring case and spaces, so "Toys" and " toys " count as duplicates */
const findByName = (name: string) =>
  Category.findOne({ where: sqlWhere(fn("lower", fn("trim", col("categoryName"))), name.toLowerCase()) });

const validate = (name: string, description: string) => {
  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { message: `Category name must be ${NAME_MIN}–${NAME_MAX} characters.`, field: "categoryName" };
  }
  if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) {
    return { message: `Description must be ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters.`, field: "categoryDescription" };
  }
  return null;
};

class CategoryController {
  categoryData = [
    { categoryName: "Electronics", categoryImage: "", categoryDescription: "Latest electronic devices and gadgets" },
    { categoryName: "Groceries", categoryImage: "", categoryDescription: "Daily essential food items" },
    { categoryName: "Clothing", categoryImage: "", categoryDescription: "Trendy and comfortable apparel" },
  ];

  // *Seed Category Data
  async seedCategory(): Promise<void> {
    const datas = await Category.findAll();
    if (datas.length === 0) {
      await Category.bulkCreate(this.categoryData);
      console.log("Category seeded successfully");
    } else {
      console.log("Category already seeded");
    }
  }

  // *Add Category
  async addCategory(req: Request, res: Response): Promise<void> {
    const uploaded = (req as any).cloudinaryResult;
    // If anything below fails, the image that was just uploaded must not be left behind
    const reject = async (status: number, body: { message: string; field: string }) => {
      if (uploaded?.public_id) await destroyImage(uploaded.public_id);
      res.status(status).json(body);
    };

    if (!req.file || !uploaded?.secure_url) {
      await reject(400, { message: "Please add a category image.", field: "categoryImage" });
      return;
    }

    const name = String(req.body.categoryName ?? "").trim();
    const description = String(req.body.categoryDescription ?? "").trim();
    const invalid = validate(name, description);
    if (invalid) {
      await reject(400, invalid);
      return;
    }
    if (await findByName(name)) {
      await reject(400, { message: `A category called "${name}" already exists.`, field: "categoryName" });
      return;
    }

    const category = await Category.create({
      categoryName: name,
      categoryDescription: description,
      categoryImage: uploaded.public_id,
    });

    res.status(201).json({
      message: "Category created",
      data: { ...category.toJSON(), categoryImage: uploaded.secure_url, totalProducts: 0 },
    });
  }

  // *Fetch All Categories (newest first, with product counts)
  async fetchAllCategories(_req: Request, res: Response): Promise<void> {
    const categories = await Category.findAll({
      attributes: { include: [productCount] },
      order: [["createdAt", "DESC"]],
    });
    const data = categories.map(present);
    res.status(200).json({
      message: data.length ? "Categories fetched successfully" : "No categories found",
      totalCategories: data.length,
      data,
    });
  }

  // *Fetch Single Category
  async fetchSingleCategory(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const category = isUuid(id) ? await Category.findByPk(id, { attributes: { include: [productCount] } }) : null;
    if (!category) {
      res.status(404).json({ message: "Category not found", field: "general" });
      return;
    }
    res.status(200).json({ message: "Category fetched successfully", data: present(category) });
  }

  // *Update Category (name, description, and optionally a new image)
  async updateCategory(req: Request, res: Response): Promise<void> {
    const uploaded = (req as any).cloudinaryResult;
    const reject = async (status: number, body: { message: string; field: string }) => {
      if (uploaded?.public_id) await destroyImage(uploaded.public_id);
      res.status(status).json(body);
    };

    const id = String(req.params.id);
    const category = isUuid(id) ? await Category.findByPk(id) : null;
    if (!category) {
      await reject(404, { message: "Category not found", field: "general" });
      return;
    }

    // Fields that weren't sent keep their current value
    const name = req.body.categoryName === undefined ? category.categoryName : String(req.body.categoryName).trim();
    const description =
      req.body.categoryDescription === undefined ? category.categoryDescription : String(req.body.categoryDescription).trim();
    const invalid = validate(name, description);
    if (invalid) {
      await reject(400, invalid);
      return;
    }
    const sameName = await findByName(name);
    if (sameName && sameName.id !== category.id) {
      await reject(400, { message: `A category called "${name}" already exists.`, field: "categoryName" });
      return;
    }

    const oldImage = category.categoryImage;
    await category.update({
      categoryName: name,
      categoryDescription: description,
      ...(uploaded?.public_id ? { categoryImage: uploaded.public_id } : {}),
    });
    // Only remove the old image once the new one is saved
    if (uploaded?.public_id && oldImage) await destroyImage(oldImage);

    const refreshed = await Category.findByPk(category.id, { attributes: { include: [productCount] } });
    res.status(200).json({ message: "Category updated", data: present(refreshed!) });
  }

  // *Delete Category. If it still has products, they can be moved to another category first
  //  (?moveTo=<categoryId>); the move and the delete happen together or not at all.
  async deleteCategory(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const category = isUuid(id) ? await Category.findByPk(id) : null;
    if (!category) {
      res.status(404).json({ message: "Category not found", field: "general" });
      return;
    }

    const linkedProducts = await Product.count({ where: { categoryId: { [Op.eq]: id } } });
    const moveTo = typeof req.query.moveTo === "string" ? req.query.moveTo : "";

    if (linkedProducts > 0 && !moveTo) {
      res.status(400).json({
        message: `"${category.categoryName}" still has ${linkedProducts} product${linkedProducts === 1 ? "" : "s"}. Choose a category to move them to, or move them first.`,
        field: "general",
      });
      return;
    }

    let target: Category | null = null;
    if (linkedProducts > 0) {
      target = isUuid(moveTo) && moveTo !== id ? await Category.findByPk(moveTo) : null;
      if (!target) {
        res.status(400).json({ message: "Choose a different, existing category to move the products to.", field: "moveTo" });
        return;
      }
    }

    const image = category.categoryImage;
    const moved = await sequelize.transaction(async (t) => {
      const [count] = target
        ? await Product.update({ categoryId: target.id }, { where: { categoryId: id }, transaction: t })
        : [0];
      await category.destroy({ transaction: t });
      return count;
    });
    await destroyImage(image);

    res.status(200).json({
      message: target
        ? `Moved ${moved} product${moved === 1 ? "" : "s"} to "${target.categoryName}" and deleted "${category.categoryName}"`
        : "Category deleted",
      data: { moved, movedTo: target ? { id: target.id, categoryName: target.categoryName } : null },
    });
  }
}

export default new CategoryController();
