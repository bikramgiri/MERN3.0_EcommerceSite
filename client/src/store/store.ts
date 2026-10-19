import { combineReducers, configureStore, type UnknownAction } from "@reduxjs/toolkit";
import authSlice, { logout } from "./auth/authSlice";
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

const appReducer = combineReducers({
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
})

// Slices holding one user's private data (public products/categories are kept)
const userDataSlices = [
      "wishlist", "cart", "checkout",
      "datas", "adminCategory", "adminProduct", "adminOrder", "adminReview",
] as const;

type AppState = ReturnType<typeof appReducer>;

// On logout, reset private slices so the next person on this device never sees
// the previous user's cart, wishlist, orders or admin data
const rootReducer = (state: AppState | undefined, action: UnknownAction) => {
      if (state && logout.match(action)) {
            const cleared: Partial<AppState> = { ...state };
            userDataSlices.forEach((key) => delete cleared[key]);
            return appReducer(cleared as AppState, action);
      }
      return appReducer(state, action);
};

const store = configureStore({
      reducer: rootReducer
})

export default store

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
