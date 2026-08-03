import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/home/Home";
import NotFound from "./global/NotFound.js.js";
import Register from "./pages/auth/Register.js";
import Login from "./pages/auth/Login.js";
import VerifyEmail from "./pages/auth/VerifyEmail.js";
import ForgotPassword from "./pages/auth/ForgotPassword.js";
import VerifyOTP from "./pages/auth/VerifyOTP.js";
import ResetPassword from "./pages/auth/ResetPassword.js";
import ProductsWishlist from "./pages/customer/wishlist/ProductWishlist.js";
import ProductDetails from "./pages/home/productDetails/ProductDetails.js";
import CategoryProducts from "./pages/home/category/Categoryproducts .js";
import Products from "./pages/home/products/Products.js";
import Cart from "./pages/home/cart/Cart.js";
import CheckOut from "./pages/home/checkout/CheckOut.js";
import KhaltiPaymentCallback from "./pages/home/checkout/KhaltiPaymentCallback.js";
import EsewaPaymentCallback from "./pages/home/checkout/EsewaPaymentCallback.js";
import EsewaPaymentFailure from "./pages/home/checkout/EsewaPaymentFailure.js";
import MyOrders from "./pages/customer/orders/MyOrders.js";
import MyOrdersDetails from "./pages/customer/orders/MyOrdersDetails.js";
import EditMyOrders from "./pages/customer/orders/EditMyOrders.js";
import Profile from "./pages/customer/profile/Profile.js";
import Setting from "./pages/customer/setting/Setting.js";
import Layout from "./layout/customer/Layout.js";
import About from "./pages/home/about/About.js";
import { useAppDispatch } from "./hooks/hooks.js";
import { useEffect } from "react";
import { handleGoogleLogin } from "./store/auth/authSlice.js";
import AdminDashboard from "./pages/admin/adminDashboard.js";
import ProtectedRoute from "./global/ProjectedRoute.js";
import { UserRole } from "./types/customer/authTypes.js";
import AdminLayout from "./layout/admin/AdminLayout.js";
import { ThemeProvider } from "./context/ThemeContext.js";
import NotExists from "./components/admin/NotExists.js";

function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(handleGoogleLogin());
  }, [dispatch]);
  return (
    <ThemeProvider>
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
          
          <Route path="/wishlist" element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
              <ProductsWishlist />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
              <CheckOut />
            </ProtectedRoute>
          } />
          <Route
            path="/payment/khalti-callback"
            element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
                <KhaltiPaymentCallback />
              </ProtectedRoute>
          }
          />
          <Route
            path="/payment/esewa-callback"
            element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
                <EsewaPaymentCallback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/esewa-failure"
            element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
                <EsewaPaymentFailure />
              </ProtectedRoute>
            }
          />
          <Route path="/my-orders" element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
              <MyOrders />
            </ProtectedRoute>
          } />
          <Route
            path="/my-orders/orderdetails/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Customer]}>
                <MyOrdersDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders/orderdetails/editorders/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Customer]}>
                <EditMyOrders />
              </ProtectedRoute>
            }
          />

          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/setting" element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
              <Setting />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route
            index
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={
          <ProtectedRoute allowedRoles={[UserRole.Admin]}>
          <NotExists />
          </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
