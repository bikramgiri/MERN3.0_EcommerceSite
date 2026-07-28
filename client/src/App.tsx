import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/home/Home";
import NotFound from "./global/components/NotFound.js";
import Register from "./pages/auth/Register.js";
import Login from "./pages/auth/Login.js";
import VerifyEmail from "./pages/auth/VerifyEmail.js";
import ForgotPassword from "./pages/auth/ForgotPassword.js";
import VerifyOTP from "./pages/auth/VerifyOTP.js";
import ResetPassword from "./pages/auth/ResetPassword.js";
import ProductsWishlist from "./pages/wishlist/ProductWishlist.js";
import ProductDetails from "./pages/productDetails/ProductDetails.js";
import CategoryProducts from "./pages/category/Categoryproducts .js";
import Products from "./pages/products/Products.js";
import Cart from "./pages/cart/Cart.js";
import CheckOut from "./pages/checkout/CheckOut.js";
import KhaltiPaymentCallback from "./pages/checkout/KhaltiPaymentCallback.js";
import EsewaPaymentCallback from "./pages/checkout/EsewaPaymentCallback.js";
import EsewaPaymentFailure from "./pages/checkout/EsewaPaymentFailure.js";
import MyOrders from "./pages/orders/MyOrders.js";
import MyOrdersDetails from "./pages/orders/MyOrdersDetails.js";
import EditMyOrders from "./pages/orders/EditMyOrders.js";
import Profile from "./pages/profile/Profile.js";
import Setting from "./pages/setting/Setting.js";
import Layout from "./layout/Layout.js";
import About from "./pages/about/About.js";
import { useAppDispatch } from "./hooks/hooks.js";
import { useEffect } from "react";
import { handleGoogleLogin } from "./store/auth/authSlice.js";

function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(handleGoogleLogin());
  }, [dispatch]);
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/category/:categoryId" element={<CategoryProducts />} />
          <Route path="/products" element={<Products />} />
          <Route path="/productdetails/:id" element={<ProductDetails />} />
          <Route path="/wishlist" element={<ProductsWishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<CheckOut />} />
          <Route
            path="/payment/khalti-callback"
            element={<KhaltiPaymentCallback />}
          />
          <Route
            path="/payment/esewa-callback"
            element={<EsewaPaymentCallback />}
          />
          <Route
            path="/payment/esewa-failure"
            element={<EsewaPaymentFailure />}
          />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route
            path="/my-orders/orderdetails/:id"
            element={<MyOrdersDetails />}
          />
          <Route
            path="/my-orders/orderdetails/editorders/:id"
            element={<EditMyOrders />}
          />

          <Route path="/profile" element={<Profile />} />
          <Route path="/setting" element={<Setting />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
