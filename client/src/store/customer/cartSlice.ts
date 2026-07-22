import {createSlice, type PayloadAction} from "@reduxjs/toolkit";
import { CartItem, CartState } from "../../types/cartTypes";
import { Status } from "../../global/statuses";
import { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";

const initialState: CartState = {
  cart: [],
  status: Status.IDLE,
}

const cartSlice = createSlice({
      name: "cart",
      initialState,
      reducers: {
          setItems(state: CartState, action: PayloadAction<CartItem[]>) {
                  state.cart = action.payload;
          },
          setStatus(state: CartState, action: PayloadAction<Status>) {
                  state.status = action.payload;
          },
          deleteItem(state: CartState, action: PayloadAction<string>) {
               state.cart = state.cart.filter(item => item.id !== action.payload);
          },
           updateItems(state: CartState, action: PayloadAction<CartItem[]>) {
            const updatedItem = action.payload[0];
            const index = state.cart.findIndex(item => item.productId === updatedItem.productId);
            if (index !== -1) {
              state.cart[index] = updatedItem;
            }
          },
           emptyCart(state: CartState) {
              state.cart = [];
           }
      },

})

export const { setItems, setStatus, deleteItem, updateItems, emptyCart } = cartSlice.actions;
export default cartSlice.reducer;

// export function addToCart(productId: string){
//       return async function addToCartThunk(dispatch: AppDispatch){
//             dispatch(setStatus(Status.LOADING));
//             try{
//                   const response = await APIAuthenticated.post(`customer/cart`, {productId});
//                   if(response.status === 201 || response.status === 200){
//                         dispatch(fetchCartItems() );
//                         dispatch(setStatus(Status.SUCCESS));
//                   }
//             }catch(error){
//                   dispatch(setStatus(Status.ERROR));
//                   throw error;
//             }
//       }           
// }

export function addToCart(productId: string, quantity: number = 1) {
  return async function addToCartThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.post(`customer/cart`, { productId, quantity });
      if (response.status === 201 || response.status === 200) {
        dispatch(fetchCartItems());
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function fetchCartItems(){
      return async function fetchCartItemsThunk(dispatch: AppDispatch){
            dispatch(setStatus(Status.LOADING));
            try{
                  const response = await APIAuthenticated.get(`customer/cart`);
                  if(response.status === 200){
                        dispatch(setItems(response.data.data));
                        dispatch(setStatus(Status.SUCCESS));
                  }
            }catch(error){
                  dispatch(setStatus(Status.ERROR));
                  throw error;
            }
      }
}

export function updateCartItems(data: CartItem){
      return async function updateCartItemsThunk(dispatch: AppDispatch){
            dispatch(setStatus(Status.LOADING));
            try{
                  const response = await APIAuthenticated.patch(`customer/cart/${data.id}`, { quantity: data.quantity });
                  if(response.status === 200){
                        dispatch(updateItems([data]));
                        dispatch(fetchCartItems() );
                        dispatch(setStatus(Status.SUCCESS));
                  }
            }catch(error){
                  dispatch(setStatus(Status.ERROR));
                  throw error;
            }
      }
}

export function removeFromCart(cartId: string){
      return async function removeFromCartThunk(dispatch: AppDispatch){
            dispatch(setStatus(Status.LOADING));
            try{
                  const response = await APIAuthenticated.delete(`customer/cart/${cartId}`);
                  if(response.status === 200){
                        dispatch(deleteItem(cartId));
                        dispatch(fetchCartItems() );
                        dispatch(setStatus(Status.SUCCESS));
                  }
            }catch(error){
                  dispatch(setStatus(Status.ERROR));
                  throw error;
            }
      }
}
