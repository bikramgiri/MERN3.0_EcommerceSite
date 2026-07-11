import type { Status } from "../global/statuses";

export interface User {
      id: string,
      username: string,
      email: string,
      // password: string,
      role: string,
      avatar: string,
      // token: string,
      status: Status
}

export interface AuthState {
      user: User,
      status: Status,
      token: string,
      email: string,
}

export interface registerData {
      username: string,
      email: string,
      password: string
}

export interface verifyEmailData {
      email: string,
      emailVerificationToken: string
}

export interface loginData {
      email: string,
      password: string
}

export interface VerifyOTPData{
      email: string,
      otp: string
}

export interface resetPasswordData {
      resetPasswordToken: string,
      newPassword: string,
      confirmNewPassword: string
}

export interface changePasswordData {
      currentPassword: string,
      newPassword: string,
      confirmNewPassword: string
}
