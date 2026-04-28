import { Request, Response } from "express"
import Category from "../../../database/models/categoryModel"

class CategoryController{
      categoryData = [
            {
                  categoryName: "Electronics",
                  categoryImage: "",
                  categoryDescription: "Latest electronic devices and gadgets"
            },
            {
                  categoryName: "Groceries",
                  categoryImage: "",
                  categoryDescription: "Daily essential food items"
            },
            {
                  categoryName: "Clothing",
                  categoryImage: "",
                  categoryDescription: "Trendy and comfortable apparel"
            }
      ]

      // *Seed Category Data
      async seedCategory():Promise<void>{
            const datas = await Category.findAll()
            if(datas.length === 0){
                  await Category.bulkCreate(this.categoryData)
                  console.log("Category seeded successfully")
            } else {
                  console.log("Category already seeded")
            }
      }

      // *Add Category
      async addCategory(req:Request, res:Response):Promise<void> {
            const { categoryName, categoryDescription } = req.body
            if(!categoryName || !categoryDescription){
                  res.status(400).json({ 
                        message: "All fields are required",
                        field: "general" 
                  })
                  return
            }

            if(categoryName.length < 5 || categoryName.length > 20){
                  res.status(400).json({ 
                        message: "Category name must be between 5 and 20 characters",
                        field: "categoryName" 
                  })
                  return
            }

            if(categoryDescription.length < 5 || categoryDescription.length > 100){
                  res.status(400).json({ 
                        message: "Category description must be between 5 and 100 characters",
                        field: "categoryDescription" 
                  })
                  return
            }

            const existingCategory = await Category.findOne({ where: { categoryName } })
            if(existingCategory){
                  res.status(400).json({ 
                        message: "Category already exists",
                        field: "categoryName" 
                  })
                  return
            }

            const category = await Category.create({ 
                  categoryName, 
                  categoryDescription 
            })

            res.status(201).json({ 
                  message: "Category created successfully",
                  data: category 
            })
      }

      // *Fetch All Categories
      async fetchAllCategories(req:Request, res:Response):Promise<void> {
            const categories = await Category.findAll()
            if(categories.length === 0){
                  res.status(404).json({ 
                        message: "No categories found",
                        field: "general" 
                  })
                  return
            }

            res.status(200).json({ 
                  message: "Categories fetched successfully",
                  totalCategories: categories.length,
                  data: categories 
            })
      }

      // *Fetch Single Category
      async fetchSingleCategory(req:Request, res:Response):Promise<void> {
            const { id } = req.params
            if(!id){
                  res.status(400).json({ 
                        message: "Category ID is required",
                        field: "general" 
                  })
                  return
            }

            const category = await Category.findByPk(id as string)
            if(!category){
                  res.status(404).json({ 
                        message: "Category not found",
                        field: "general" 
                  })
                  return
            }
            res.status(200).json({ 
                  message: "Category fetched successfully",
                  data: category 
            })
      }

      // *Update Category
      async updateCategory(req:Request, res:Response):Promise<void> {
            const { id } = req.params
            if(!id){
                  res.status(400).json({ 
                        message: "Category ID is required",
                        field: "general" 
                  })
                  return
            }

            const { categoryName, categoryDescription } = req.body

            // *Check if category exists
            const category = await Category.findByPk(id as string)
            if(!category){
                  res.status(404).json({ 
                        message: "Category not found",
                        field: "general" 
                  })
                  return
            }

            if(categoryName.length < 5 || categoryName.length > 20){
                  res.status(400).json({ 
                        message: "Category name must be between 5 and 20 characters",
                        field: "categoryName" 
                  })
                  return
            }

            if(categoryDescription.length < 5 || categoryDescription.length > 100){
                  res.status(400).json({ 
                        message: "Category description must be between 5 and 100 characters",
                        field: "categoryDescription" 
                  })
                  return
            }

            const existingCategory = await Category.findOne({ where: { categoryName } })
            if(existingCategory && existingCategory.id !== id){
                  res.status(400).json({ 
                        message: "Category name already exists",
                        field: "categoryName" 
                  })
                  return
            }

            const updatedCategory = await category.update({
                  categoryName,
                  categoryDescription
            })

            res.status(200).json({ 
                  message: "Category updated successfully",
                  data: updatedCategory 
            })
      }

      // *Delete Category
      async deleteCategory(req:Request, res:Response):Promise<void> {
            const { id } = req.params
            if(!id){
                  res.status(400).json({ 
                        message: "Category ID is required",
                        field: "general" 
                  })
                  return
            }

            const category = await Category.findByPk(id as string)
            if(!category){
                  res.status(404).json({ 
                        message: "Category not found",
                        field: "general" 
                  })
                  return
            }

            await category.destroy()

            res.status(200).json({ 
                  message: "Category deleted successfully"
            })
      }
}

export default new CategoryController;