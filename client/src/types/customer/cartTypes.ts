import { Category } from './productTypes';

// The cart only receives approved ratings, not full reviews
export interface CartReview {
  id: string;
  rating: number;
}

export interface CartProduct {
  id: string;
  productName: string;
  productPrice: number;
  productStock: number;
  productImage: string;
  category: Category
  reviews?: CartReview[]
}

export interface CartItem{
  id: string,
  quantity: number,
  productId: string,
  userId: string,
  createdAt: string,
  updatedAt: string,
  product: CartProduct,
}
export interface CartState{
  cart: CartItem[]
  status: string
}
