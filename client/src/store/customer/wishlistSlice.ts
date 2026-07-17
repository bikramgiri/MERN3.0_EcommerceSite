import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Status } from "../../global/statuses";
import type {
  AddToWishlistData,
  WishlistState,
} from "../../types/wishlistTypes";
import type { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";
import type { Product } from "../../types/productTypes";

const initialState: WishlistState = {
  wishlist: [],
  status: Status.IDLE,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlist: (state: WishlistState, action: PayloadAction<Product[]>) => {
      state.wishlist = action.payload;
    },
    addToWishlist: (state: WishlistState, action: PayloadAction<Product>) => {
      if (!action.payload) return;
      if (!state.wishlist.some((p) => p.id === action.payload.id)) {
        state.wishlist.push(action.payload);
      }
    },
    removeFromWishlist: (
      state: WishlistState,
      action: PayloadAction<string>,
    ) => {
      state.wishlist = state.wishlist.filter((p) => p.id !== action.payload);
    },
    setStatus: (state: WishlistState, action: PayloadAction<Status>) => {
      state.status = action.payload;
    },
  },
});

export const { setWishlist, addToWishlist, removeFromWishlist, setStatus } =
  wishlistSlice.actions;

export default wishlistSlice.reducer;

export function AddToWishlist(product: AddToWishlistData) {
  return async function addToWishlistThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.post("/customer/wishlist", {
        productId: product.id,
      });
      if (response.data.action === "removed") {
        dispatch(removeFromWishlist(response.data.data.id));
      } else {
        dispatch(addToWishlist(response.data.data));
      }
      dispatch(setStatus(Status.SUCCESS));
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function fetchUserWishlist() {
  return async function fetchUserWishlistThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.get("/customer/wishlist");
      dispatch(setWishlist(response.data.data || []));
      dispatch(setStatus(Status.SUCCESS));
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function removeWishlistItem(productId: string) {
  return async function removeWishlistItemThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.delete(
        `/customer/wishlist/${productId}`,
      );
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(removeFromWishlist(productId));
      }
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}
