import { Category, UserData } from './productTypes';

export interface Review {
  id: string;
  rating: number;
  message: string;
  reviewImage: string | null;
  createdAt: string;
  productId: string
  userId: string
}

export interface CartProduct {
  id: string;
  productName: string;
  productPrice: number;
  productStock: number;
  productImage: string;
  category: Category
  reviews: Review[]
}

export interface CartItem{
  id: string,
  quantity: number,
  productId: string,
  userId: string,
  createdAt: string,
  updatedAt: string,
  product: CartProduct,
  user: UserData
}
export interface CartState{
  cart: CartItem[]
  status: string
}
