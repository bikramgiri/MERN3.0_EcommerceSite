import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Status } from "../../global/statuses";
import type {
  AuthState,
  changePasswordData,
  loginData,
  registerData,
  resendVerificationEmailData,
  resetPasswordData,
  UserData,
  verifyEmailData,
  VerifyOTPData,
} from "../../types/customer/authTypes";
import type { AppDispatch } from "../store";
import { API, APIAuthenticated } from "../../http";

const storedUser =
  typeof window !== "undefined" ? localStorage.getItem("user") : null;
const storedToken =
  typeof window !== "undefined" ? (localStorage.getItem("token") ?? "") : "";

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : ({} as UserData),
  status: Status.IDLE,
  token: storedToken,
  email: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state: AuthState, action: PayloadAction<UserData>) => {
      state.user = action.payload;
      if (typeof window !== "undefined" && localStorage) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      }
    },
    setStatus: (state: AuthState, action: PayloadAction<Status>) => {
      state.status = action.payload;
    },
    setToken: (state: AuthState, action: PayloadAction<string>) => {
      state.token = action.payload;
      if (action.payload && typeof window !== "undefined" && localStorage) {
        localStorage.setItem("token", action.payload);
      } else {
        localStorage.removeItem("token");
      }
    },
    logout: (state: AuthState) => {
      state.user = {} as UserData;
      state.token = "";
      state.status = Status.IDLE;
      if (typeof window !== "undefined" && localStorage) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    },
    resetAuth: (state: AuthState) => {
      state.user = {} as UserData;
      state.token = "";
      state.email = "";
      state.status = Status.IDLE;
      if (typeof window !== "undefined" && localStorage) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    },
    resetAuthStatus: (state: AuthState) => {
      state.status = Status.IDLE;
    },
    setEmail: (state: AuthState, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    editProfile: (state: AuthState, action: PayloadAction<UserData>) => {
      state.user = action.payload;
      if (typeof window !== "undefined" && localStorage) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      }
    },
    editAvatar: (state: AuthState, action: PayloadAction<string>) => {
      state.user = { ...state.user, avatar: action.payload };
      if (typeof window !== "undefined" && localStorage) {
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    removeAvatar: (state: AuthState) => {
      state.user = { ...state.user, avatar: "" };
      if (typeof window !== "undefined" && localStorage) {
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
  },
});

export const {
  setUser,
  setStatus,
  setToken,
  logout,
  resetAuth,
  resetAuthStatus,
  setEmail,
  editProfile,
  editAvatar,
  removeAvatar,
} = authSlice.actions;
export default authSlice.reducer;

export function registerUser(data: registerData) {
  return async function registerUserThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.post("/auth/register", data);
      if (response.status === 201) {
        dispatch(setStatus(Status.SUCCESS));
        return response.data;
      }
    } catch (error) {
      console.error("Error during user registration:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
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

// After Google sign-in the server redirects here with ?googleCode=…, a one-time code
// that is swapped for the login token (works even when the shop and API are on different domains)
export function handleGoogleLogin() {
  return async function (dispatch: AppDispatch) {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("googleCode");
    if (!code) return;

    // Remove the code from the address bar straight away (it only works once)
    urlParams.delete("googleCode");
    const rest = urlParams.toString();
    window.history.replaceState({}, document.title, window.location.pathname + (rest ? `?${rest}` : ""));

    dispatch(setStatus(Status.LOADING));
    try {
      const response = await API.post("/auth/google/exchange", { code });
      const { data: userData, token } = response.data;
      localStorage.setItem("token", token);
      dispatch(setToken(token));
      dispatch(setUser(userData));
      localStorage.setItem("user", JSON.stringify(userData));
      dispatch(fetchProfile());
      dispatch(setStatus(Status.SUCCESS));
    } catch (error) {
      console.error("Google login processing failed:", error);
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
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Failed to log out on the server:", error);
    } finally {
      // Always end the session on this device, even if the server is unreachable
      dispatch(logout());
      dispatch(setStatus(Status.SUCCESS));
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
      const response = await APIAuthenticated.post(
        "/auth/change-password",
        data,
      );
      // Other devices are signed out; this one continues with the fresh token
      if (typeof response.data?.token === "string") dispatch(setToken(response.data.token));
      dispatch(setStatus(Status.SUCCESS));
      return response;
    } catch (error) {
      console.log("Failed to change password:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function fetchProfile() {
  return async function fetchProfileThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.get("/common/profile");
      dispatch(setUser(response.data.data));
      dispatch(setStatus(Status.SUCCESS));
    } catch (error) {
      console.log("Failed to fetch user profile:", error);
      dispatch(setStatus(Status.ERROR));
    }
  };
}

export function updateProfile(payload: UserData) {
  return async function updateProfileThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.patch("/common/profile", payload);
      if (response.status === 200) {
        dispatch(editProfile(response.data.data));
        dispatch(setStatus(Status.SUCCESS));
        dispatch(fetchProfile());
      }
      // pendingEmail is set when a code was sent to a new email address
      return response.data as { message: string; pendingEmail: string | null };
    } catch (error) {
      console.log("Failed to edit profile:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

// Finish an email change with the 6-digit code sent to the new address
export function confirmEmailChange(code: string) {
  return async function confirmEmailChangeThunk(dispatch: AppDispatch) {
    const response = await APIAuthenticated.post("/common/profile/email/confirm", { code });
    dispatch(editProfile(response.data.data));
    return response.data as { message: string };
  };
}

// Drop an email change that hasn't been confirmed yet
export function cancelEmailChange() {
  return async function cancelEmailChangeThunk(dispatch: AppDispatch) {
    const response = await APIAuthenticated.delete("/common/profile/email");
    dispatch(editProfile(response.data.data));
  };
}

export function updateAvatar(payload: FormData) {
  return async function updateAvatarThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.patch(
        "/common/profile/avatar",
        payload,
      );
      if (response.status === 200) {
        dispatch(editAvatar(response.data.data.avatar));
        dispatch(setStatus(Status.SUCCESS));
        dispatch(fetchProfile());
      }
    } catch (error) {
      console.log("Failed to update avatar:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}

export function deleteAvatar() {
  return async function deleteAvatarThunk(dispatch: AppDispatch) {
    dispatch(setStatus(Status.LOADING));
    try {
      const response = await APIAuthenticated.delete("/common/profile/avatar");
      if (response.status === 200) {
        dispatch(removeAvatar());
        dispatch(setStatus(Status.SUCCESS));
        dispatch(fetchProfile());
      }
    } catch (error) {
      console.log("Failed to update avatar:", error);
      dispatch(setStatus(Status.ERROR));
      throw error;
    }
  };
}
