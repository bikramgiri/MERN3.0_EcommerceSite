import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Status } from "../../global/statuses";
import type { Product, ProductState } from "../../types/customer/productTypes";
import type { AppDispatch, RootState } from "../store";
import { API } from "../../http";

const initialState: ProductState = {
  product: [],
  status: Status.LOADING,
  singleProduct: {} as Product,
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setProducts: (state: ProductState, action: PayloadAction<Product[]>) => {
      state.product = action.payload;
    },
    setStatus: (state: ProductState, action: PayloadAction<Status>) => {
      state.status = action.payload;
    },
    setSingleProduct: (state: ProductState, action: PayloadAction<Product>) => {
      state.singleProduct = action.payload;
    },
    updateSingleProductStockQty(
      state: ProductState,
      action: PayloadAction<{ productId: string; newStockQty: number }>,
    ) {
      const { productId, newStockQty } = action.payload;
      if (state.singleProduct?.id === productId) {
        state.singleProduct = {
          ...state.singleProduct,
          productStock: newStockQty,
        };
      }

      // Optional: also update in the products list (if you want consistency)
      state.product = state.product.map((product) =>
        product.id === productId
          ? { ...product, productTotalStockQty: newStockQty }
          : product,
      );
    },
  },
});

export const {
  setProducts,
  setStatus,
  setSingleProduct,
  updateSingleProductStockQty,
} = productSlice.actions;
export default productSlice.reducer;

export function fetchProducts() {
  return async function fetchProductsThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.get("/admin/product");
      dispatch(setProducts(response.data.data.reverse()));
      dispatch(setStatus(Status.SUCCESS));
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

// *Fetch Single product
// export function fetchSingleProduct(productId: string){
//       return async function fetchSingleProductThunk(dispatch: AppDispatch) {
//         dispatch(setStatus(Status.LOADING));
//         try {
//             const response = await API.get(`/admin/product/${productId}`);
//             dispatch(setSingleProduct(response.data.data));
//             dispatch(setStatus(Status.SUCCESS));
//         } catch (error) {
//             dispatch(setStatus(Status.ERROR));
//             throw error;
//         }
//     }
// }

// *OR

// *Fetch Single product without API call
export function fetchSingleProduct(productId: string) {
  return async function fetchSingleProductThunk(
    dispatch: AppDispatch,
    getState: () => RootState,
  ) {
    // Show the copy from the product list straight away (if any), but always refresh it,
    // so stock, price and reviews on the details page are never stale
    const cached = getState().product.product.find(
      (product: Product) => product.id === productId,
    );
    if (cached) {
      dispatch(setSingleProduct(cached));
      dispatch(setStatus(Status.SUCCESS));
    } else {
      dispatch(setStatus(Status.LOADING));
    }
    try {
      const response = await API.get(`/admin/product/${productId}`);
      dispatch(setSingleProduct(response.data.data));
      dispatch(setStatus(Status.SUCCESS));
    } catch (error) {
      // With a cached copy on screen, a failed refresh can be ignored
      if (!cached) {
        dispatch(setStatus(Status.ERROR));
        throw error;
      }
    }
  };
}

