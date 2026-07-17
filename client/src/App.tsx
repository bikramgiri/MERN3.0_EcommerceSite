import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Layout from "./global/components/Layout"
import Home from "./pages/home/Home"
import NotFound from "./global/components/NotFound.js"
import Register from "./pages/auth/Register.js"
import Login from "./pages/auth/Login.js"
import VerifyEmail from "./pages/auth/VerifyEmail.js"
import ForgotPassword from "./pages/auth/ForgotPassword.js"
import VerifyOTP from "./pages/auth/VerifyOTP.js"
import ResetPassword from "./pages/auth/ResetPassword.js"
import Wishlist from "./pages/wishlist/wishlist.js"

function App() {

  return (
    <BrowserRouter>
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="light" />
    <Routes>

      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/wishlist" element={<Wishlist />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
