import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Status } from "../../global/statuses";
import type { AuthState, changePasswordData, loginData, registerData, resendVerificationEmailData, resetPasswordData, User, verifyEmailData, VerifyOTPData } from "../../types/authTypes";
import type { AppDispatch } from "../store";
import { API, APIAuthenticated } from "../../http";

const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

const initialState: AuthState = {
      user: storedUser ? JSON.parse(storedUser) :  {} as User,
      status: Status.IDLE,
      token: storedToken,
      email: "",
}

const authSlice = createSlice({
      name: "auth",
      initialState,
      reducers: {
            setUser: (state: AuthState, action:PayloadAction<User>) => {
                  state.user = action.payload;
                  if (typeof window !== "undefined" && localStorage) {
                        localStorage.setItem("user", JSON.stringify(action.payload));
                  }
            },
            setStatus: (state: AuthState, action:PayloadAction<Status>) => {
                  state.status = action.payload;
            },
            setToken: (state: AuthState, action:PayloadAction<string>) => {
                  state.token = action.payload;
                  if (action.payload && typeof window !== "undefined" && localStorage) {
                        localStorage.setItem("token", action.payload);
                  } else {
                        localStorage.removeItem("token");
                  }
            },
            logout: (state: AuthState) => {
                  state.user = {} as User;
                  state.token = "";
                  state.status = Status.IDLE;
                  if (typeof window !== "undefined" && localStorage) {
                        localStorage.removeItem("user");
                        localStorage.removeItem("token");
                        localStorage.removeItem("userId");
                        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  }
            },
            resetAuth: (state: AuthState) => {
                  state.user = {} as User;
                  state.token = "";
                  state.email = "";
                  state.status = Status.IDLE;
                  if (typeof window !== "undefined" && localStorage) {
                        localStorage.removeItem("user");
                        localStorage.removeItem("token");
                        localStorage.removeItem("userId");
                        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  }
            },
            resetAuthStatus: (state: AuthState) => {
                  state.status = Status.IDLE;
            },
            setEmail: (state: AuthState, action:PayloadAction<string>) => {
                  state.email = action.payload;
            }
      }
})

export const { setUser, setStatus, setToken, logout, resetAuth, resetAuthStatus, setEmail } = authSlice.actions
export default authSlice.reducer

export function registerUser(data: registerData) {
      return async function registerUserThunk(dispatch: AppDispatch) {
           dispatch(setStatus(Status.LOADING))
           try{
            const response = await API.post("/auth/register", data)
            if(response.status === 201){
                  dispatch(setStatus(Status.SUCCESS))
                  return response.data
            }
           } catch (error) {
            console.error("Error during user registration:", error);
            dispatch(setStatus(Status.ERROR))
            throw error
           }
      }
}

export function verifyEmail(data: verifyEmailData) {
  return async function verifyEmailThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.post("/auth/verify-email", data);
      if (response.status === 200) {
        dispatch(setStatus(Status.SUCCESS));
        return response.data;
      }
    } catch (error) {
      console.error("Error during email verification:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function resendVerificationEmail(data: resendVerificationEmailData) {
  return async function resendVerificationEmailThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.post("/auth/resend-verification-email", data);
      dispatch(setStatus(Status.SUCCESS));
      return response.data;
    } catch (error) {
      console.error("Error resending verification email:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function loginUser(data: loginData) {
  return async function loginUserThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.post("/auth/login", data);      
      if (response.status === 200) {
         dispatch(setUser(response.data.data));
         dispatch(setToken(response.data.token));
         dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      console.log("Failed to login user:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

// Hits the backend so the httpOnly session cookie actually gets cleared —
// document.cookie writes in the `logout` reducer can't touch httpOnly cookies.
export function logoutUser() {
  return async function logoutUserThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.post("/auth/logout");
      if (response.status === 200) {
        dispatch(logout());
        dispatch(setStatus(Status.SUCCESS));
      }
    } catch (error) {
      console.error("Failed to log out on the server:", error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function forgotPassword(data: { email: string }) {
  return async function forgotPasswordThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.post("/auth/forgot-password", data);
      dispatch(setEmail(data.email));
      dispatch(setStatus(Status.SUCCESS));
      return response; 
    } catch (error) {
      console.log("Failed to forgot password:", error);
      dispatch(setStatus(Status.ERROR));
      throw error; 
    }
  };
}

export function verifyOTP(data: VerifyOTPData) {
  return async function verifyOTPThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.post("/auth/verify-otp", data);
      dispatch(setEmail(data.email));
      dispatch(setStatus(Status.SUCCESS));
      return response; 
    } catch (error) {
      console.log("Failed to verify OTP:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function resetPassword(data: resetPasswordData) {
  return async function resetPasswordThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.post("/auth/reset-password", data);
      dispatch(setStatus(Status.SUCCESS));
      return response;
    } catch (error) {
      console.log("Failed to reset password:", error);
      dispatch(setStatus(Status.ERROR));
      throw error; 
    }
  };
}

export function changePassword(data: changePasswordData) {
  return async function changePasswordThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.post("/auth/change-password", data);
      dispatch(setStatus(Status.SUCCESS));
      return response;
    } catch (error) {
      console.log("Failed to change password:", error);
      dispatch(setStatus(Status.ERROR));
      throw error; 
    }
  };
}
