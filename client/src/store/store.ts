import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./auth/authSlice";
import categorySlice from "./customer/categorySlice";
import productSlice from "./customer/productSlice";
import wishlistSlice from "./customer/wishlistSlice";
import reviewSlice from "./customer/reviewSlice";
import cartSlice from "./customer/cartSlice";
import checkoutSlice from "./customer/checkoutSlice";

const store = configureStore({
      reducer: {
            auth: authSlice,
            category: categorySlice,
            product: productSlice,
            wishlist: wishlistSlice,
            review: reviewSlice,
            cart: cartSlice,
            checkout: checkoutSlice
      }
})

export default store

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
