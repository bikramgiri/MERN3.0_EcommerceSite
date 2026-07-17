import type { Status } from "../global/statuses"
import type { Product } from "./productTypes"

export interface AddToWishlistData{
      id: string
      userId?: string,
      productId?: string
}

export interface WishlistState{
      wishlist: Product[];
      status: Status;
}
