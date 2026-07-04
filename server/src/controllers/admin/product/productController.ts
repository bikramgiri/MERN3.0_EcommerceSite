import { Request, Response } from "express";
import { AuthRequest } from "../../../middleware/authMiddleware";
import Product from "../../../database/models/productModel";
import Category from "../../../database/models/categoryModel";
import User from "../../../database/models/userModel";
import deleteImageFromDisk from "../../../services/helper";
import getFullImageUrl from "../../../services/imageHandler";
import { cloudinary } from "../../../cloudinary";
import Payment from "../../../database/models/paymentModel";
import Order from "../../../database/models/orderModel";
import OrderDetails from "../../../database/models/orderDetailsModel";

class ProductController {
  public static async addProduct(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized",
        field: "userId",
      });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({
        message: "Product image is required",
        field: "productImage",
      });
      return;
    }

    // Cloudinary Storage
    const cloudinaryResult = (req as any).cloudinaryResult;
    if (!cloudinaryResult || !cloudinaryResult.secure_url) {
      res.status(500).json({ message: "Product Image upload failed" });
      return;
    }

    const productImage = cloudinaryResult.secure_url;
    const fileName = productImage.split("/").pop() || "";

    const { productName, productDescription, categoryId } = req.body;

    const productPrice = Number(req.body.productPrice);
    const productStock = Number(req.body.productStock);
    const productDiscount = Number(req.body.productDiscount);

    if (
      !productName ||
      !productDescription ||
      req.body.productPrice === undefined ||
      req.body.productPrice === "" ||
      req.body.productStock === undefined ||
      req.body.productStock === "" ||
      req.body.productDiscount === undefined ||
      req.body.productDiscount === "" ||
      !categoryId
    ) {
      res
        .status(400)
        .json({ message: "All fields are required", field: "general" });
      return;
    }

    if (productName.length < 3 || productName.length > 30) {
      res.status(400).json({
        message: "Product name must be between 3 and 30 characters",
        field: "productName",
      });
      return;
    }

    if (productDescription.length < 5 || productDescription.length > 500) {
      res.status(400).json({
        message: "Product description must be between 5 and 500 characters",
        field: "productDescription",
      });
      return;
    }

    if (isNaN(productPrice) || productPrice <= 0) {
      res.status(400).json({
        message: "Product price must be a positive number",
        field: "productPrice",
      });
      return;
    }

    if (isNaN(productStock) || productStock < 0) {
      res.status(400).json({
        message: "Product stock must be a non-negative number",
        field: "productStock",
      });
      return;
    }

    if (
      isNaN(productDiscount) ||
      productDiscount < 0 ||
      productDiscount > 100
    ) {
      res.status(400).json({
        message: "Product discount must be a number between 0 and 100",
        field: "productDiscount",
      });
      return;
    }

    if (
      !categoryId ||
      typeof categoryId !== "string" ||
      categoryId.trim() === ""
    ) {
      res
        .status(400)
        .json({ message: "Category ID is required", field: "categoryId" });
      return;
    }

    const existingProduct = await Product.findOne({ where: { productName } });
    if (existingProduct) {
      res.status(400).json({
        message: "Product with the same name already exists",
        field: "productName",
      });
      return;
    }

    const existingProductImage = await Product.findOne({
      where: { productImage },
    });
    if (existingProductImage) {
      res.status(400).json({
        message: "Product with the same image already exists",
        field: "productImage",
      });
      return;
    }

    const categoryDoc = await Category.findByPk(categoryId);
    if (!categoryDoc) {
      res.status(400).json({
        message: "Category not found",
        field: "categoryId",
      });
      return;
    }

    const product = await Product.create({
      productName,
      productDescription,
      productPrice,
      productStock,
      productDiscount,
      productImage: fileName, // Store only the filename in the database
      categoryId: categoryDoc.id,
      userId,
    });

    const productWithProductImageUrl = {
      ...product.toJSON(),
      productImage: productImage, // Use the full URL for the response
    };

    res.status(201).json({
      message: "Product added successfully",
      data: productWithProductImageUrl,
    });
  }

  // *Fetch All Products
  public static async fetchAllProducts(
    req: Request,
    res: Response,
  ): Promise<void> {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "categoryName"],
        },
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
    });
    if (products.length === 0) {
      res.status(404).json({
        message: "No products found",
        field: "general",
      });
      return;
    }

    const productsWithProductImageUrl = products.map((product) => {
      const productData = product.toJSON();
      return {
        ...productData,
        productImage: getFullImageUrl(productData.productImage), // Use the helper function to get full URL
      };
    });
    productsWithProductImageUrl.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.status(200).json({
      message: "Products fetched successfully",
      totalProducts: productsWithProductImageUrl.length,
      data: productsWithProductImageUrl,
    });
  }

  // *Fetch Single Product
  public static async fetchSingleProduct(
    req: Request,
    res: Response,
  ): Promise<void> {
    const productId = req.params.id;
    if (!productId) {
      res.status(400).json({
        message: "Product ID is required",
        field: "general",
      });
      return;
    }

    const product = await Product.findByPk(productId as string, {
      include: [
        {
          model: Category,
          attributes: ["id", "categoryName"],
        },
        {
          model: User,
          attributes: ["id", "username", "email"],
        },
      ],
    });
    if (!product) {
      res.status(404).json({
        message: "Product not found",
        field: "general",
      });
      return;
    }

    const productWithProductImageUrl = {
      ...product.toJSON(),
      productImage: getFullImageUrl(product.productImage), // Use the helper function to get full URL
    };

    res.status(200).json({
      message: "Product fetched successfully",
      data: productWithProductImageUrl,
    });
  }

  // *Fetch Products by Category
  public static async fetchProductsByCategory(
    req: Request,
    res: Response,
  ): Promise<void> {
    const categoryId = req.params.categoryId;
    if (!categoryId) {
      res.status(400).json({
        message: "Category ID is required",
        field: "general",
      });
      return;
    }

    const products = await Product.findAll({
      where: {
        categoryId,
      },
      include: [
        {
          model: Category,
          attributes: ["id", "categoryName"],
        },
        {
          model: User,
          attributes: ["id", "username", "email"],
        },
      ],
    });

    if (products.length === 0) {
      res.status(404).json({
        message: "No products found for the specified category",
        field: "general",
      });
      return;
    }

    const categoryProductsWithImageUrl = products.map((product) => {
      const productData = product.toJSON();
      return {
        ...productData,
        productImage: getFullImageUrl(productData.productImage), // Use the helper function to get full URL
      };
    });
    categoryProductsWithImageUrl.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.status(200).json({
      message: "Category Products fetched successfully",
      totalProducts: categoryProductsWithImageUrl.length,
      data: categoryProductsWithImageUrl,
    });
  }

  // *Fetch Products by User
  public static async fetchProductsByUser(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({
        message: "User ID is required",
        field: "general",
      });
      return;
    }

    const products = await Product.findAll({
      where: {
        userId,
      },
      include: [
        {
          model: Category,
          attributes: ["id", "categoryName"],
        },
        {
          model: User,
          attributes: ["id", "username", "email"],
        },
      ],
    });

    if (products.length === 0) {
      res.status(404).json({
        message: "No products found for the specified user",
        field: "general",
      });
      return;
    }

    const userProductsWithImageUrl = products.map((product) => {
      const productData = product.toJSON();
      return {
        ...productData,
        productImage: getFullImageUrl(productData.productImage), // Use the helper function to get full URL
      };
    });
    userProductsWithImageUrl.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.status(200).json({
      message: "User Products fetched successfully",
      totalProducts: userProductsWithImageUrl.length,
      data: userProductsWithImageUrl,
    });
  }

  // *Update Product
  public static async updateProduct(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const productId = req.params.id;
    if (!productId) {
      res.status(400).json({
        message: "Product ID is required",
        field: "general",
      });
      return;
    }

    const product = await Product.findByPk(productId as string);
    if (!product) {
      res.status(404).json({
        message: "Product not found",
        field: "general",
      });
      return;
    }

    const userId = req.user?.id;
    if (product.userId !== userId) {
      res.status(403).json({
        message: "Forbidden! You don't have permission to update this product",
        field: "general",
      });
      return;
    }

    const { productName, productDescription, categoryId } = req.body;
    const productPrice = Number(req.body.productPrice);
    const productStock = Number(req.body.productStock);
    const productDiscount = Number(req.body.productDiscount);

    if (productName.length < 3 || productName.length > 30) {
      res.status(400).json({
        message: "Product name must be between 3 and 30 characters",
        field: "productName",
      });
      return;
    }

    if (productDescription.length < 5 || productDescription.length > 500) {
      res.status(400).json({
        message: "Product description must be between 5 and 500 characters",
        field: "productDescription",
      });
      return;
    }

    if (isNaN(productPrice) || productPrice <= 0) {
      res.status(400).json({
        message: "Product price must be a positive number",
        field: "productPrice",
      });
      return;
    }

    if (isNaN(productStock) || productStock < 0) {
      res.status(400).json({
        message: "Product stock must be a non-negative number",
        field: "productStock",
      });
      return;
    }

    if (
      isNaN(productDiscount) ||
      productDiscount < 0 ||
      productDiscount > 100
    ) {
      res.status(400).json({
        message: "Product discount must be a number between 0 and 100",
        field: "productDiscount",
      });
      return;
    }

    let resolvedCategoryId: string;
    if (categoryId) {
      if (typeof categoryId !== "string" || categoryId.trim() === "") {
        res
          .status(400)
          .json({ message: "Category ID is required", field: "categoryId" });
        return;
      }
      const categoryDoc = await Category.findByPk(categoryId);
      if (!categoryDoc) {
        res
          .status(400)
          .json({ message: "Category not found", field: "categoryId" });
        return;
      }
      resolvedCategoryId = categoryDoc.id;
    } else {
      resolvedCategoryId = product.categoryId;
    }

    // *For Cloudinary: update product image only if a new image is uploaded
    let fileName = product.productImage; // Keep old filename
    let productImage = getFullImageUrl(fileName); // Default full URL

    // Handle new image upload
    const cloudinaryResult = (req as any).cloudinaryResult;
    if (cloudinaryResult && cloudinaryResult.secure_url) {
      // Delete old image from Cloudinary
      const oldProductImage = product.productImage.split("/").pop() || "";
      cloudinary.uploader.destroy(
        oldProductImage,
        (error: any, result: any) => {
          if (error) {
            console.error("Error deleting old image from Cloudinary:", error);
          } else {
            console.log(
              "Old image deleted from Cloudinary successfully:",
              result,
            );
          }
        },
      );

      productImage = cloudinaryResult.secure_url; // update to new image URL
      fileName = productImage.split("/").pop() || ""; // update to new filename
    }

    // Remove Existing images
    if (req.body.productImageToRemove) {
      let productImageToRemove = req.body.productImageToRemove;
      if (typeof productImageToRemove === "string")
        productImageToRemove = JSON.parse(productImageToRemove);

      // Delete from Cloudinary
      if (productImageToRemove.length > 0) {
        const publicIds = productImageToRemove.map((filename: string) => {
          const withoutExt = filename.replace(/\.[^/.]+$/, "");
          return `Mern2_Ecommerce_Website/${withoutExt}`;
        });
        await cloudinary.uploader.destroy(publicIds, {
          resource_type: "image",
          invalidate: true,
        });
      }

      // Remove from DB productImage
      await product.update({ productImage: null });
    }

    const updatedProduct = await product.update({
      productName,
      productDescription,
      productPrice,
      productStock,
      productDiscount,
      categoryId: resolvedCategoryId,
      productImage: fileName, // Store only the filename in the database
    });

    const updatedProductDataWithImageUrl = {
      ...updatedProduct.toJSON(),
      productImage: productImage, // Use the full URL for the response
    };

    res.status(200).json({
      message: "Product updated successfully",
      data: updatedProductDataWithImageUrl,
    });
  }

  // *Delete Product
  public static async deleteProduct(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    const productId = req.params.id;
    if (!productId) {
      res.status(400).json({
        message: "Product ID is required",
        field: "general",
      });
      return;
    }

    const product = await Product.findByPk(productId as string);
    if (!product) {
      res.status(404).json({
        message: "Product not found",
        field: "general",
      });
      return;
    }

    const userId = req.user?.id;
    if (product.userId !== userId) {
      res.status(403).json({
        message: "Forbidden! You don't have permission to delete this product",
        field: "general",
      });
      return;
    }

    await product.destroy();

    // Delete image from Cloudinary
    const fileName = product.productImage.split("/").pop() || "";
    cloudinary.uploader.destroy(fileName, (error: any, result: any) => {
      if (error) {
        console.error("Error deleting image from Cloudinary:", error);
      } else {
        console.log("Image deleted from Cloudinary successfully:", result);
      }
    });

    res.status(200).json({
      message: "Product deleted successfully",
    });
  }

  // *Update Product Stock
  public static async updateProductStock(
      req: AuthRequest,
      res: Response
    ): Promise<void> {
      const productId = req.params.id;
      if (!productId) {
        res.status(400).json({
          message: "Product ID is required",
          field: "general",
        });
        return;
      }

      const product = await Product.findByPk(productId as string);
      if (!product) {
        res.status(404).json({
          message: "Product not found",
          field: "general",
        });
        return;
      }

      const userId = req.user?.id;
      if (product.userId !== userId) {
        res.status(403).json({
          message: "Forbidden! You don't have permission to update this product",
          field: "general",
        });
        return;
      }

      const { productStock } = req.body;
      if (productStock === undefined || productStock === "") {
        res.status(400).json({
          message: "Product stock is required",
          field: "productStock",
        });
        return;
      }

      if (isNaN(productStock) || productStock < 0) {
        res.status(400).json({
          message: "Product stock must be a non-negative number",
          field: "productStock",
        });
        return;
      }

      await product.update({ productStock });

      res.status(200).json({
        message: "Product stock updated successfully",
        data: product,
      });
    }

    // *Fetch Orders of a Product
    public static async fetchProductOrders(
      req: AuthRequest,
      res: Response,
    ): Promise<void> {
      const productId = req.params.id;
      if (!productId) {
        res.status(400).json({
          message: "Product ID is required",
          field: "general",
        });
        return;
      }

      const product = await Product.findByPk(productId as string);
      if (!product) {
        res.status(404).json({
          message: "Product not found",
          field: "general",
        });
        return;
      }

      const productOrders = await Product.findAll({
        where: { id: productId },
        attributes: ['id', 'productName', 'productTotalStockQty'],
        include: [  
          { 
            model: OrderDetails, 
            attributes: ['id', 'quantity'],
            include: [
              { 
                model: Order,
                attributes: ['id', 'orderStatus', 'totalAmount', 'shippingAddress', 'phoneNumber', "createdAt"],
                include: [
                  {
                    model: User,
                    attributes: ['id', 'username', 'email']
                  },
                  {
                    model: Payment,
                    attributes: ['id', 'paymentMethod', 'paymentStatus']
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!productOrders || productOrders.length === 0) {
        res.status(404).json({
          message: "No orders found for this product",
          field: "general",
        });
        return;
      }

      res.status(200).json({
        message: "Product orders fetched successfully",
        totalOrders: productOrders.length,
        data: productOrders,
      });
    }

}

export default ProductController;
