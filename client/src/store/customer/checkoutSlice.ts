import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { emptyCart } from "./cartSlice";
import { CheckoutState, DecodedData, EsewaPaymentData, FetchOrder, OrderData, OrderStatus, PaymentStatus } from "../../types/checkoutTypes";
import { Status } from "../../global/statuses";
import { AppDispatch } from "../store";
import { APIAuthenticated } from "../../http";

const initialState: CheckoutState = {
  checkout: [],
  status: Status.IDLE,
  khaltiUrl: null,
  esewaUrl: null,
  esewaPaymentData: null,
  myOrder: [],
  singleOrder: null
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setItems(state: CheckoutState, action: PayloadAction<OrderData[]>) {
      state.checkout = action.payload;
    },
    setMyOrders(state: CheckoutState, action: PayloadAction<FetchOrder[]>) {
      state.myOrder = action.payload;
    },
    setSingleOrder(state: CheckoutState, action: PayloadAction<FetchOrder | null>) {
      state.singleOrder = action.payload;
    },
    setStatus(state: CheckoutState, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
    setKhaltiUrl(
      state: CheckoutState,
      action: PayloadAction<CheckoutState["khaltiUrl"]>,
    ) {
      state.khaltiUrl = action.payload;
    },
    setEsewaUrl(
      state: CheckoutState,
      action: PayloadAction<CheckoutState["esewaUrl"]>,
    ) {
      state.esewaUrl = action.payload;
    },
     setEsewaPaymentData(state: CheckoutState, action: PayloadAction<EsewaPaymentData | null>) {
      state.esewaPaymentData = action.payload;
    },
    deleteOrder(state: CheckoutState, action: PayloadAction<string>) {
      state.myOrder = state.myOrder.filter(
        (order) => order.id !== action.payload,
      );
    },
    updateMyOrderStatus(
      state: CheckoutState,
      action: PayloadAction<{ orderId: string; status: OrderStatus }>,
    ) {
      const { orderId, status } = action.payload;
      state.myOrder = state.myOrder.map((order) =>
        order.id === orderId ? { ...order, orderStatus: status } : order,
      );

      // Optional: also update in the single product (if you want consistency)
      if (state.singleOrder && state.singleOrder.id === orderId) {
        state.singleOrder = { ...state.singleOrder, orderStatus: status };
      }

    },
    updateSingleOrderStatus: (
      state: CheckoutState,
      action: PayloadAction<{ orderId: string; status: OrderStatus }>,
    ) => {
      const { orderId, status } = action.payload;

      // Update the nested Order.orderStatus inside singleOrder array
      if (state.singleOrder && state.singleOrder.id === orderId) {
        state.singleOrder = { ...state.singleOrder, orderStatus: status };
      }
    },
    updatePaymentStatus(
      state: CheckoutState,
      action: PayloadAction<{ orderId: string; status: PaymentStatus }>,
    ) {
      const { orderId, status } = action.payload;
      state.myOrder = state.myOrder.map((order) =>
        order.id === orderId ? { 
          ...order,
          Payment: {
              ...order.Payment,
              paymentStatus: status,
            }, 
        }
        : order
      );
    },
    updateSingleOrderPaymentStatus: (
      state: CheckoutState,
      action: PayloadAction<{ orderId: string; status: PaymentStatus }>,
    ) => {
      const { orderId, status } = action.payload;
       if (state.singleOrder && state.singleOrder.id === orderId) {
        state.singleOrder = {
          ...state.singleOrder,
          Payment: { ...state.singleOrder.Payment, paymentStatus: status },
        };
      }
    },
  },
});

export const {
  setItems,
  setMyOrders,
  setSingleOrder,
  setStatus,
  setKhaltiUrl,
  setEsewaUrl,
  setEsewaPaymentData,
  deleteOrder,
  updateMyOrderStatus,
  updateSingleOrderStatus,
  updatePaymentStatus,
  updateSingleOrderPaymentStatus,
} = checkoutSlice.actions;
export default checkoutSlice.reducer;

export function createOrder(data: OrderData) {
  return async function createOrderThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.post("/customer/order", data);
      if (response.status === 201) {
         if (response.data.paymentUrl) dispatch(setKhaltiUrl(response.data.paymentUrl));
        if (response.data.esewaPaymentUrl) dispatch(setEsewaUrl(response.data.esewaPaymentUrl));
        if (response.data.esewaPaymentData) dispatch(setEsewaPaymentData(response.data.esewaPaymentData));
        dispatch(setStatus(Status.SUCCESS));
        dispatch(fetchMyOrder());
        dispatch(emptyCart());
        return response.data; 
      }
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function fetchMyOrder() {
  return async function fetchOrderThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.get("/customer/order");
      if (response.status === 200) {
        dispatch(setMyOrders(response.data.data)); 
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

// export function fetchMySingleOrder(id: string) {
//   return async function fetchOrderThunk(dispatch: AppDispatch) {
//     dispatch(setStatus(Status.LOADING));
//     try {
//       const response = await APIAuthenticated.get(`/customer/order/${id}`);
//       if (response.status === 200) {
//         dispatch(setSingleOrder(response.data.data));
//         dispatch(setStatus(Status.SUCCESS));
//       }
//     } catch (error) {
//       dispatch(setStatus(Status.ERROR));
//       throw error;
//     }
//   };
// }

// *Or

// *Fetch Single order without API call
export function fetchMySingleOrder(id: string){
  return async function fetchMySingleOrderThunk(dispatch: AppDispatch, getState: () => {checkout: CheckoutState}) {
      const store = getState();
      const orders = store.checkout.myOrder;
      const existOrder = orders.find(
        (order: FetchOrder) => order.id === id,
      );
      if (existOrder) {
        dispatch(setSingleOrder((existOrder)));
        dispatch(setStatus(Status.SUCCESS));
      } else {
        dispatch(setStatus(Status.LOADING));
        try {
          const response = await APIAuthenticated.get(`/customer/order/${id}`);
          if(response.status === 200){
                dispatch(setSingleOrder(response.data.data))
                dispatch(setStatus(Status.SUCCESS));
          }
        } catch (error) {
          dispatch(setStatus(Status.ERROR));
          throw error;
        }
      }
  }
}

// *Verify Khalti Payment
export function verifyKhaltiPayment(pidx : string) {
  return async function verifyPaymentThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.post("/customer/verify-khalti-payment", {
        pidx,
      });
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(fetchMyOrder());
        return response.data;
      }
    } catch (error) {
      console.log("Failed to verify payment:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

// *Verify eSewa Payment 
export function verifyEsewaPayment(decodedData: DecodedData) {
  return async function verifyEsewaThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.post(
        "/customer/verify-esewa-payment",
        decodedData
      );
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        dispatch(fetchMyOrder());
        return response.data;
      }
    } catch (error) {
      console.error("Failed to verify eSewa payment:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function editMyOrders(id: string, data: OrderData) {
  return async function editMyOrdersThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.patch(`/customer/order/${id}`, data);
      if (response.status === 200) {
        dispatch(setSingleOrder(response.data.data));
        dispatch(setStatus(Status.SUCCESS));
        dispatch(fetchMyOrder());
      }
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function deleteMyOrders(id: string) {
  return async function deleteMyOrdersThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.delete(`/customer/order/${id}`);
      if (response.status === 200) {
        dispatch(deleteOrder(id));
        dispatch(setSingleOrder(null));
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}
