import type { UserData } from "./productTypes"

export interface Product{
      id: string,
      productName: string,
      productImage: string,
      productDescription: string
}

export interface Review{
      id: string,
      rating: number,
      message: string,
      reviewImage: string,
      status?: string,
      adminReply?: string | null,
      repliedAt?: string | null,
      createdAt: string,
      updatedAt?: string,
      userId: string,
      productId: string
      User: UserData,
      Product: Product
}

export interface ReviewState{
      review: Review[];
      status: string;
}
