
export interface UserData{
      id: string,
      username: string,
      email: string
      avatar?: string
}

export interface Category{
      id: string,
      categoryName: string
}

export interface Review{
      id: string,
      rating: number,
      message: string,
      reviewImage: string
      createdAt: string,
      updatedAt: string,
      User: UserData
}

export interface Product{
      id: string,
      productId?: string,
      productName: string,
      productImage: string,
      productDescription: string,
      productPrice: number,
      productStock: number,
      brand?: string,
      productDiscount: number,
      oldPrice?: number,
      createdAt: string,
      updatedAt: string,
      userId: string,
      categoryId: string
      owner: UserData,
      category: Category,
      reviews?: Review[]
}

export interface ProductState{
      product: Product[],
      status: string,
      singleProduct: Product | null
}
