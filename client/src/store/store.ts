import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./auth/authSlice";
import categorySlice from "./customer/categorySlice";
import productSlice from "./customer/productSlice";
import wishlistSlice from "./customer/wishlistSlice";
import reviewSlice from "./customer/reviewSlice";

const store = configureStore({
      reducer: {
            auth: authSlice,
            category: categorySlice,
            product: productSlice,
            wishlist: wishlistSlice,
            review: reviewSlice,
      }
})

export default store

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
