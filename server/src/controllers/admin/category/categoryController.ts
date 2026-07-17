import { Request, Response } from "express";
import Category from "../../../database/models/categoryModel";
import getFullImageUrl from "../../../services/imageHandler";
import { cloudinary } from "../../../cloudinary";
import { getPublicIdFromAvatar } from "../../../services/cloudinaryHelper";
import Product from "../../../database/models/productModel";

class CategoryController {
  categoryData = [
    {
      categoryName: "Electronics",
      categoryImage: "",
      categoryDescription: "Latest electronic devices and gadgets",
    },
    {
      categoryName: "Groceries",
      categoryImage: "",
      categoryDescription: "Daily essential food items",
    },
    {
      categoryName: "Clothing",
      categoryImage: "",
      categoryDescription: "Trendy and comfortable apparel",
    },
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
    const file = req.file;
    if (!file) {
      res.status(400).json({
        message: "Category image is required",
        field: "categoryImage",
      });
      return;
    }

    // Get cloudinary resukt from middleware
    const cloudinaryResult = (req as any).cloudinaryResult;
    if (!cloudinaryResult || !cloudinaryResult.secure_url) {
      res.status(500).json({
        message: "Error uploading image to Cloudinary",
        field: "categoryImage",
      });
      return;
    }

    const categoryImage = cloudinaryResult.secure_url;
    const fileName = cloudinaryResult.public_id;

    const { categoryName, categoryDescription } = req.body;
    if (!categoryName || !categoryDescription) {
      res.status(400).json({
        message: "All fields are required",
        field: "general",
      });
      return;
    }

    if (categoryName.length < 5 || categoryName.length > 30) {
      res.status(400).json({
        message: "Category name must be between 5 and 30 characters",
        field: "categoryName",
      });
      return;
    }

    if (categoryDescription.length < 5 || categoryDescription.length > 100) {
      res.status(400).json({
        message: "Category description must be between 5 and 100 characters",
        field: "categoryDescription",
      });
      return;
    }

    const existingCategory = await Category.findOne({
      where: { categoryName },
    });
    if (existingCategory) {
      res.status(400).json({
        message: "Category already exists",
        field: "categoryName",
      });
      return;
    }

    const category = await Category.create({
      categoryName,
      categoryDescription,
      categoryImage: fileName,
    });

    const categoryWithImageUrl = {
      ...category.toJSON(),
      categoryImage: categoryImage, // Use the full Cloudinary URL
    };

    res.status(201).json({
      message: "Category created successfully",
      data: categoryWithImageUrl,
    });
  }

  // *Fetch All Categories
  async fetchAllCategories(req: Request, res: Response): Promise<void> {
    const categories = await Category.findAll({
      include: [
        {
          model: Product,
          attributes: ["id"], // We don't need product details, just the count
        },
      ],
    });
    if (categories.length === 0) {
      res.status(404).json({
        message: "No categories found",
        field: "general",
      });
      return;
    }

    const categoriesWithImageUrl = categories.map((c) => {
      const plain = c.toJSON();
      const { products, ...rest } = plain;
      return {
        ...rest,
        categoryImage: getFullImageUrl(plain.categoryImage), // Use the helper function to get full URL
        totalProducts: products ? products.length : 0, // Include the total product count
      };
    });
    categoriesWithImageUrl.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.status(200).json({
      message: "Categories fetched successfully",
      totalCategories: categoriesWithImageUrl.length,
      data: categoriesWithImageUrl,
    });
  }

  // *Fetch Single Category
  async fetchSingleCategory(req: Request, res: Response): Promise<void> {
    const categoryId = req.params.id;
    if (!categoryId) {
      res.status(400).json({
        message: "Category ID is required",
        field: "general",
      });
      return;
    }

    const category = await Category.findByPk(categoryId as string, {
      include: [
        {
          model: Product,
          attributes: ["id"], 
        },
      ],
    });
    if (!category) {
      res.status(404).json({
        message: "Category not found",
        field: "general",
      });
      return;
    }

    const plain = category.toJSON() as any;
    const { products, ...rest } = plain;
    const categoryWithImageUrl = {
      ...rest,
      categoryImage: getFullImageUrl(category.categoryImage),
      totalProducts: products ? products.length : 0, 
    };

    res.status(200).json({
      message: "Category fetched successfully",
      data: categoryWithImageUrl,
    });
  }

  // *Update Category
  async updateCategory(req: Request, res: Response): Promise<void> {
    const categoryId = req.params.id;
    if (!categoryId) {
      res.status(400).json({
        message: "Category ID is required",
        field: "general",
      });
      return;
    }

    const { categoryName, categoryDescription } = req.body;

    // *Check if category exists
    const category = await Category.findByPk(categoryId as string);
    if (!category) {
      res.status(404).json({
        message: "Category not found",
        field: "general",
      });
      return;
    }

    if (categoryName && (categoryName.length < 5 || categoryName.length > 30)) {
      res.status(400).json({
        message: "Category name must be between 5 and 30 characters",
        field: "categoryName",
      });
      return;
    }

    if (
      categoryDescription &&
      (categoryDescription.length < 5 || categoryDescription.length > 100)
    ) {
      res.status(400).json({
        message: "Category description must be between 5 and 100 characters",
        field: "categoryDescription",
      });
      return;
    }

    const existingCategory = await Category.findOne({
      where: { categoryName },
    });
    if (existingCategory && existingCategory.id !== categoryId) {
      res.status(400).json({
        message: "Category name already exists",
        field: "categoryName",
      });
      return;
    }

    // *For Cloudinary: update category image only if a new image is uploaded
    let fileName = category.categoryImage;
    let categoryImage = fileName ? getFullImageUrl(fileName) : "";

    // new upload
    const cloudinaryResult = (req as any).cloudinaryResult;
    if (cloudinaryResult && cloudinaryResult.secure_url) {
      if (category.categoryImage) {
        const oldPublicId = getPublicIdFromAvatar(category.categoryImage);
        if (oldPublicId) {
          cloudinary.uploader.destroy(
            oldPublicId,
            (error: any, result: any) => {
              if (error) console.error("Error deleting old image:", error);
              else console.log("Old image deleted:", result);
            },
          );
        }
      }
      categoryImage = cloudinaryResult.secure_url;
      fileName = cloudinaryResult.public_id;
    }

    // explicit removal (no new upload)
    if (req.body.categoryImageToRemove) {
      let categoryImageToRemove = req.body.categoryImageToRemove;
      if (typeof categoryImageToRemove === "string") {
        categoryImageToRemove = JSON.parse(categoryImageToRemove);
      }

      if (categoryImageToRemove.length > 0) {
        const publicIds = categoryImageToRemove.map((img: string) =>
          getPublicIdFromAvatar(img),
        );
        await cloudinary.uploader.destroy(publicIds, {
          resource_type: "image",
          invalidate: true,
        });
      }

      fileName = "";
      categoryImage = "";
    }

    const updatedCategory = await category.update({
      categoryName,
      categoryDescription,
      categoryImage: fileName, // now correctly reflects whichever branch ran
    });

    const categoryWithImageUrl = {
      ...updatedCategory.toJSON(),
      // categoryImage: getFullImageUrl(updatedCategory.categoryImage) // Use the helper function to get full URL
      // or
      categoryImage: categoryImage,
    };

    res.status(200).json({
      message: "Category updated successfully",
      data: categoryWithImageUrl,
    });
  }

  // *Delete Category
  async deleteCategory(req: Request, res: Response): Promise<void> {
    const categoryId = req.params.id;
    if (!categoryId) {
      res.status(400).json({
        message: "Category ID is required",
        field: "general",
      });
      return;
    }

    const category = await Category.findByPk(categoryId as string);
    if (!category) {
      res.status(404).json({
        message: "Category not found",
        field: "general",
      });
      return;
    }

    if (category.categoryImage) {
      const publicId = getPublicIdFromAvatar(category.categoryImage);
      if (publicId) {
        cloudinary.uploader.destroy(publicId, (error: any, result: any) => {
          if (error)
            console.error("Error deleting image from Cloudinary:", error);
          else
            console.log("Image deleted from Cloudinary successfully:", result);
        });
      }
    }

    await category.destroy();

    res.status(200).json({
      message: "Category deleted successfully",
    });
  }
}

export default new CategoryController();
