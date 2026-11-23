import { handleAccountBlocked } from "./http";
import { loadSitePromotion } from "./services/couponService";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/home/Home";
import NotFound from "./global/NotFound.js.js";
import Login from "./pages/auth/Login.js";
import Layout from "./layout/customer/Layout.js";
import ScrollToTop from "./global/ScrollToTop";
import {
  NewsletterConfirm,
  NewsletterUnsubscribe,
} from "./pages/home/newsletter/NewsletterPages";
import { useAppDispatch } from "./hooks/hooks.js";
import { lazy, Suspense, useEffect } from "react";
import { handleGoogleLogin, logout } from "./store/auth/authSlice.js";
import { isTokenExpired, getTokenRemainingMs } from "./utils/token.js";
import { handleSessionExpiry } from "./http/index.js";
import ProtectedRoute from "./global/ProjectedRoute.js";
import GuestOnlyRoute from "./global/GuestOnlyRoute";
import { UserRole } from "./types/customer/authTypes.js";
import { ThemeProvider, useTheme } from "./context/ThemeContext.js";
import NotExists from "./components/admin/NotExists.js";
import { connectSocket } from "./services/socket.js";
import AdminPageSkeleton from "./layout/admin/AdminPageSkeleton";
import {
  applyStoreSettings,
  loadStoreSettings,
} from "./services/storeSettingsService";

// Admin pages are loaded on demand so shoppers don't download the dashboard code
// Shop pages load when first visited, so the home page opens fast (Home and Login stay in the main bundle)
const Register = lazy(() => import("./pages/auth/Register.js"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail.js"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword.js"));
const VerifyOTP = lazy(() => import("./pages/auth/VerifyOTP.js"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword.js"));
const ProductsWishlist = lazy(() => import("./pages/customer/wishlist/ProductWishlist.js"));
const ProductDetails = lazy(() => import("./pages/home/productDetails/ProductDetails.js"));
const Products = lazy(() => import("./pages/home/products/Products.js"));
const Cart = lazy(() => import("./pages/home/cart/Cart.js"));
const CheckOut = lazy(() => import("./pages/home/checkout/CheckOut.js"));
const KhaltiPaymentCallback = lazy(() => import("./pages/home/checkout/KhaltiPaymentCallback.js"));
const EsewaPaymentCallback = lazy(() => import("./pages/home/checkout/EsewaPaymentCallback.js"));
const EsewaPaymentFailure = lazy(() => import("./pages/home/checkout/EsewaPaymentFailure.js"));
const MyOrders = lazy(() => import("./pages/customer/orders/MyOrders.js"));
const MyOrdersDetails = lazy(() => import("./pages/customer/orders/MyOrdersDetails.js"));
const EditMyOrders = lazy(() => import("./pages/customer/orders/EditMyOrders.js"));
const Profile = lazy(() => import("./pages/customer/profile/Profile.js"));
const Setting = lazy(() => import("./pages/customer/setting/Setting.js"));
const About = lazy(() => import("./pages/home/about/About.js"));
const FAQ = lazy(() => import("./pages/home/faq/FAQ"));
const PrivacyPolicy = lazy(() => import("./pages/home/legal/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/home/legal/Terms"));

const AdminLayout = lazy(() => import("./layout/admin/AdminLayout.js"));
const AdminDashboard = lazy(() => import("./pages/admin/adminDashboard.js"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement.js"));
const CategoryManagement = lazy(() => import("./pages/admin/CategoryManagement"));
const ProductManagement = lazy(() => import("./pages/admin/ProductManagement"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const ReviewManagement = lazy(() => import("./pages/admin/ReviewManagement"));
const NewsletterSubscribers = lazy(() => import("./pages/admin/NewsletterSubscribers"));
const CouponManagement = lazy(() => import("./pages/admin/CouponManagement"));
const AdminProfile = lazy(() => import("./pages/admin/Profile.js"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

// Old /category/:id links now open the products page with that category selected
function CategoryRedirect() {
  const { categoryId } = useParams();
  return <Navigate to={`/products?category=${encodeURIComponent(categoryId ?? "")}`} replace />;
}

// Toasts follow the admin theme inside the admin area; the storefront is always light
function ThemedToastContainer() {
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const isAdminArea = pathname.startsWith("/admin-dashboard");

  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme={isAdminArea && theme === "dark" ? "dark" : "light"}
    />
  );
}

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    Promise.resolve(dispatch(handleGoogleLogin())).catch(() =>
      toast.error("Google sign-in didn't finish. Please try again."),
    );

    // Store settings (shipping, payments, maintenance) come from the server
    loadStoreSettings().catch(() => {});
    loadSitePromotion();

    // Connect socket so live storefront visitors are counted in real-time,
    // and settings changes by the admin show up without a refresh
    const socket = connectSocket();
    socket.on("store:settings-updated", applyStoreSettings);
    socket.on("store:promotions-updated", loadSitePromotion);
    // The store blocked this account while it was open
    socket.on("auth:blocked", handleAccountBlocked);

    const checkTokenStatus = () => {
      const token = localStorage.getItem("token");
      if (token && isTokenExpired(token)) {
        handleSessionExpiry();
      }
    };

    // Check on initial load
    checkTokenStatus();

    // Schedule automatic logout when remaining time expires
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const token = localStorage.getItem("token");
    if (token) {
      const remainingMs = getTokenRemainingMs(token);
      if (remainingMs > 0) {
        timerId = setTimeout(() => {
          handleSessionExpiry();
        }, remainingMs);
      }
    }

    // Check when user returns to tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkTokenStatus();
      }
    };

    const handleSessionExpiredEvent = () => {
      dispatch(logout());
    };

    window.addEventListener("focus", checkTokenStatus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("auth:session-expired", handleSessionExpiredEvent);

    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener("focus", checkTokenStatus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("auth:session-expired", handleSessionExpiredEvent);
      socket.off("store:settings-updated", applyStoreSettings);
      socket.off("store:promotions-updated", loadSitePromotion);
      socket.off("auth:blocked", handleAccountBlocked);
    };
  }, [dispatch]);
  return (
    <ThemeProvider>
    <BrowserRouter>
      <ScrollToTop />
      <ThemedToastContainer />
      <Suspense fallback={<div className="min-h-screen bg-[#FDF8ED]" />}>
      <Routes>
        {/* Signed-in users skip the login and sign-up forms */}
        <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/newsletter/confirm" element={<NewsletterConfirm />} />
          <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
          <Route path="/category/:categoryId" element={<CategoryRedirect />} />
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

        <Route
          path="/admin-dashboard"
          element={
            <Suspense fallback={<AdminPageSkeleton />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <CategoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="products"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <ProductManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <OrderManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="reviews"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <ReviewManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="coupons"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <CouponManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="subscribers"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <NewsletterSubscribers />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <AdminProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <AdminSettings />
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
      </Suspense>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
