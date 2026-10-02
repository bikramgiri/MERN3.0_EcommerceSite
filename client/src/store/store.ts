import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./auth/authSlice";
import datasSlice from "./admin/datasSlice";
import adminCategorySlice from "./admin/categorySlice";
import adminProductSlice from "./admin/productSlice";
import adminOrderSlice from "./admin/orderSlice";
import adminReviewSlice from "./admin/reviewSlice";
import categorySlice from "./customer/categorySlice";
import productSlice from "./customer/productSlice";
import wishlistSlice from "./customer/wishlistSlice";
import reviewSlice from "./customer/reviewSlice";
import cartSlice from "./customer/cartSlice";
import checkoutSlice from "./customer/checkoutSlice";

const store = configureStore({
      reducer: {
            auth: authSlice,
            datas: datasSlice,
            adminCategory: adminCategorySlice,
            adminProduct: adminProductSlice,
            adminOrder: adminOrderSlice,
            adminReview: adminReviewSlice,

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
