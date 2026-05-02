import { Request, Response } from "express"
import { AuthRequest } from "../../../middleware/authMiddleware"
import Product from "../../../database/models/productModel"
import Category from "../../../database/models/categoryModel"
import User from "../../../database/models/userModel"
import deleteImageFromDisk from "../../../services/helper"

class ProductController {
      public static async addProduct(req:AuthRequest, res:Response):Promise<void> {
            const userId = req.user?.id
            if(!userId){
                  res.status(401).json({
                        message: "Unauthorized",
                        field: "userId" 
                  })
                  return
            }

            const file = req.file;
            if(!file){
                  res.status(400).json({
                        message: "Product image is required",
                        field: "productImage"
                  })
                  return
            }

            const productImage = file.filename
            const productImageUrl = `${process.env.BACKEND_URL}/storage/${productImage}`
            
            const { productName, productDescription, categoryId } = req.body
            
                  const productPrice = Number(req.body.productPrice)
                  const productStock = Number(req.body.productStock)
                  const productDiscount = Number(req.body.productDiscount)

           if (
                !productName ||
                !productDescription ||
                req.body.productPrice    === undefined || req.body.productPrice    === "" ||
                req.body.productStock    === undefined || req.body.productStock    === "" ||
                req.body.productDiscount === undefined || req.body.productDiscount === "" ||
                !categoryId
            ) {
                deleteImageFromDisk(productImage) 
                res.status(400).json({ message: "All fields are required", field: "general" })
                return
            }

            if(productName.length < 3 || productName.length > 30){
                        deleteImageFromDisk(productImage)
                  res.status(400).json({
                        message: "Product name must be between 3 and 30 characters",
                        field: "productName" 
                  })
                  return
            }

            if(productDescription.length < 5 || productDescription.length > 500){
                        deleteImageFromDisk(productImage)
                  res.status(400).json({
                        message: "Product description must be between 5 and 500 characters",
                        field: "productDescription" 
                  })
                  return
            }

            if(isNaN(productPrice) || productPrice <= 0){
                        deleteImageFromDisk(productImage)
                  res.status(400).json({
                        message: "Product price must be a positive number",
                        field: "productPrice" 
                  })
                  return
            }

            if(isNaN(productStock) || productStock < 0){
                        deleteImageFromDisk(productImage)
                  res.status(400).json({
                        message: "Product stock must be a non-negative number",
                        field: "productStock" 
                  })
                  return
            }

            if(isNaN(productDiscount) || productDiscount < 0 || productDiscount > 100){
                        deleteImageFromDisk(productImage)
                  res.status(400).json({
                        message: "Product discount must be a number between 0 and 100",
                        field: "productDiscount" 
                  })
                  return
            }

                  if (!categoryId || typeof categoryId !== "string" || categoryId.trim() === "") {
                        deleteImageFromDisk(productImage)
                        res.status(400).json({ message: "Category ID is required", field: "categoryId" })
                        return
                  }

            const existingProduct = await Product.findOne({ where: { productName } })
            if(existingProduct){
                  deleteImageFromDisk(productImage)
                  res.status(400).json({
                        message: "Product with the same name already exists",
                        field: "productName" 
                  })
                  return
            }

            const existingProductImage = await Product.findOne({ where: { productImage } })
            if(existingProductImage){
                  deleteImageFromDisk(productImage)
                  res.status(400).json({
                        message: "Product with the same image already exists",
                        field: "productImage" 
                  })
                  return
            }

            const categoryDoc = await Category.findByPk(categoryId)
            if(!categoryDoc){
                  deleteImageFromDisk(productImage)
                  res.status(400).json({
                        message: "Category not found",
                        field: "categoryId" 
                  })
                  return
            }

            const product = await Product.create({
                  productName, 
                  productDescription,
                  productPrice,
                  productStock,
                  productDiscount,
                  productImage,
                  categoryId: categoryDoc.id,
                  userId
            })

            const productWithProductImageUrl = product.toJSON() as any
            productWithProductImageUrl.productImageUrl = productImageUrl
            productWithProductImageUrl.categoryName = categoryDoc.categoryName

            res.status(201).json({
                  message: "Product added successfully",
                  data: productWithProductImageUrl
            })
      } 

      // *Fetch All Products
      public static async fetchAllProducts(req:Request, res:Response):Promise<void> {
            const products = await Product.findAll({
                  include: [
                        {
                              model: Category,
                              attributes: ['id', 'categoryName']
                        },
                        {
                              model: User,
                              attributes: ['id', 'username']
                        }
                  ]
            })
            if(products.length === 0){
                  res.status(404).json({
                        message: "No products found",
                        field: "general" 
                  })
                  return
            }

            const productsWithProductImageUrl = products.map(product => {
                  const productData = product.toJSON() as any
                  productData.productImageUrl = `${process.env.BACKEND_URL}/storage/${product.productImage}`
                  return productData
            })
            productsWithProductImageUrl.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

            res.status(200).json({
                  message: "Products fetched successfully",
                  totalProducts: products.length,
                  data: productsWithProductImageUrl
            })
      }

      // *Fetch Single Product
      public static async fetchSingleProduct(req:Request, res:Response):Promise<void> {
            const productId = req.params.id
            if(!productId){
                  res.status(400).json({
                        message: "Product ID is required",
                        field: "general" 
                  })
                  return
            }

            const product = await Product.findByPk(productId as string, {
                  include: [
                        {
                              model: Category,
                              attributes: ['id', 'categoryName']
                        },
                        {
                              model: User,
                              attributes: ['id', 'username', 'email']
                        }
                  ]
            })
            if(!product){
                  res.status(404).json({
                        message: "Product not found",
                        field: "general" 
                  })
                  return
            }

            const productWithProductImageUrl = product.toJSON() as any
            productWithProductImageUrl.productImageUrl = `${process.env.BACKEND_URL}/storage/${product.productImage}`
            
            res.status(200).json({
                  message: "Product fetched successfully",
                  data: productWithProductImageUrl
            })
      }

      // *Fetch Products by Category
      public static async fetchProductsByCategory(req:Request, res:Response):Promise<void> {
            const categoryId = req.params.categoryId
            if(!categoryId){
                  res.status(400).json({
                        message: "Category ID is required",
                        field: "general"
                  })
                  return
            }

            const products = await Product.findAll({
                  where: {
                        categoryId
                  },
                  include: [
                        {
                              model: Category,
                              attributes: ['id', 'categoryName']
                        },
                        {
                              model: User,
                              attributes: ['id', 'username', 'email']
                        }
                  ]
            })

            if(products.length === 0){
                  res.status(404).json({
                        message: "No products found for the specified category",
                        field: "general"
                  })
                  return
            }

            const categoryProductsWithImageUrl = products.map(product => {
                  const productWithProductImageUrl = product.toJSON() as any
                  productWithProductImageUrl.productImageUrl = `${process.env.BACKEND_URL}/storage/${product.productImage}`
                  return productWithProductImageUrl
            })
            categoryProductsWithImageUrl.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

            res.status(200).json({
                  message: "Category Products fetched successfully",
                  totalProducts: products.length,
                  data: categoryProductsWithImageUrl
            })
      }

      // *Fetch Products by User
      public static async fetchProductsByUser(req:AuthRequest, res:Response):Promise<void> {
            const userId = req.user?.id
            if(!userId){
                  res.status(400).json({
                        message: "User ID is required",
                        field: "general"
                  })
                  return
            }

            const products = await Product.findAll({
                  where: {
                        userId
                  },
                  include: [
                        {
                              model: Category,
                              attributes: ['id', 'categoryName']
                        },
                        {
                              model: User,
                              attributes: ['id', 'username', 'email']
                        }
                  ]
            })

            if(products.length === 0){
                  res.status(404).json({
                        message: "No products found for the specified user",
                        field: "general"
                  })
                  return
            }

            const userProductsWithImageUrl = products.map(product => {
                  const productWithProductImageUrl = product.toJSON() as any
                  productWithProductImageUrl.productImageUrl = `${process.env.BACKEND_URL}/storage/${product.productImage}`
                  return productWithProductImageUrl
            })
            userProductsWithImageUrl.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

            res.status(200).json({
                  message: "User Products fetched successfully",
                  totalProducts: products.length,
                  data: userProductsWithImageUrl
            })
      }

      // *Update Product
      public static async updateProduct(req:AuthRequest, res:Response):Promise<void> {
            const productId = req.params.id
            if(!productId){
                  res.status(400).json({
                        message: "Product ID is required",
                        field: "general" 
                  })
                  return
            }

            const product = await Product.findByPk(productId as string)
            if(!product){
                  res.status(404).json({
                        message: "Product not found",
                        field: "general" 
                  })
                  return
            }

            const userId = req.user?.id
                  if (product.userId !== userId) {
                        res.status(403).json({ 
                              message: "Forbidden! You don't have permission to update this product", 
                              field: "general" 
                        })
                        return
                  }


             const { productName, productDescription, categoryId } = req.body
                  const productPrice = Number(req.body.productPrice)
                  const productStock = Number(req.body.productStock)
                  const productDiscount = Number(req.body.productDiscount)

            if(productName.length < 3 || productName.length > 30){
                  res.status(400).json({
                        message: "Product name must be between 3 and 30 characters",
                        field: "productName" 
                  })
                  return
            }

            if(productDescription.length < 5 || productDescription.length > 500){
                  res.status(400).json({
                        message: "Product description must be between 5 and 500 characters",
                        field: "productDescription" 
                  })
                  return
            }

          if(isNaN(productPrice) || productPrice <= 0){
                  res.status(400).json({
                        message: "Product price must be a positive number",
                        field: "productPrice" 
                  })
                  return
            }

            if(isNaN(productStock) || productStock < 0){
                  res.status(400).json({
                        message: "Product stock must be a non-negative number",
                        field: "productStock" 
                  })
                  return
            }

            if(isNaN(productDiscount) || productDiscount < 0 || productDiscount > 100){
                  res.status(400).json({
                        message: "Product discount must be a number between 0 and 100",
                        field: "productDiscount" 
                  })
                  return
            }

                  let resolvedCategoryId: string
                  if (categoryId) {
                        if (typeof categoryId !== "string" || categoryId.trim() === "") {
                              res.status(400).json({ message: "Category ID is required", field: "categoryId" })
                              return
                        }
                        const categoryDoc = await Category.findByPk(categoryId)
                        if (!categoryDoc) {
                              res.status(400).json({ message: "Category not found", field: "categoryId" })
                              return
                        }
                        resolvedCategoryId = categoryDoc.id
                  } else {
                        resolvedCategoryId = product.categoryId
                  }

            const file = req.file;
            let newProductImage: string
            let newProductImageUrl: string
            if (file) {
                  newProductImage = file?.filename;
                  newProductImageUrl = `${process.env.BACKEND_URL}/storage/${newProductImage}`;

                  deleteImageFromDisk(product.productImage)
            }
            else {
                  newProductImage = product.productImage
                  newProductImageUrl = `${process.env.BACKEND_URL}/storage/${product.productImage}`
            }

            if (req.body.productImageToRemove) {
                  const productImageToRemove = req.body.productImageToRemove
                  deleteImageFromDisk(productImageToRemove)
            }

            const updatedProduct = await product.update({
                  productName,
                  productDescription,
                  productPrice,
                  productStock,
                  productDiscount,
                  categoryId: resolvedCategoryId,
                  productImage: newProductImage
            })

            const updatedProductData = updatedProduct.toJSON() as any
            updatedProductData.productImageUrl = newProductImageUrl

            res.status(200).json({
                  message: "Product updated successfully",
                  data: updatedProductData
            })
      }

      // *Delete Product
      public static async deleteProduct(req:AuthRequest, res:Response):Promise<void> {
            const productId = req.params.id
            if(!productId){
                  res.status(400).json({
                        message: "Product ID is required",
                        field: "general" 
                  })
                  return
            }

            const product = await Product.findByPk(productId as string)
            if(!product){
                  res.status(404).json({
                        message: "Product not found",
                        field: "general" 
                  })
                  return
            }

            const userId = req.user?.id
            if(product.userId !== userId){
                  res.status(403).json({
                        message: "Forbidden! You don't have permission to delete this product",
                        field: "general" 
                  })
                  return
            }

            await product.destroy()

            deleteImageFromDisk(product.productImage)

            res.status(200).json({
                  message: "Product deleted successfully"
            })
      }
}

export default ProductController