import type { Status } from "../global/statuses";

export interface User {
      id: string,
      username: string,
      email: string,
      // password: string,
      role: string,
      avatar: string,
      // token: string,
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

export interface resendVerificationEmailData {
      email: string
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

export interface PasswordChecks {
      minLength: boolean,
      hasUppercase: boolean,
      hasLowercase: boolean,
      hasSpecialCharacter: boolean,
      hasNumber: boolean,
}

export interface ValidationCheckProps {
      passed: boolean,
      label: string,
}

export interface AuthFormProps {
  type: "login" | "register";
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
  values: {
    username?: string;
    email: string;
    password: string;
  };
  errors: {
    username?: string;
    email: string;
    password: string;
    general: string;
  };
  message?: unknown;
  passwordStrength?: {
    score?: number;
    label: string;
    color: string;
    width: string;
  };
  // Register-only — omitted by Login.tsx, so kept optional here
  passwordChecks?: PasswordChecks;
  allChecksPassed?: boolean;
  ValidationCheck?: (props: ValidationCheckProps) => React.JSX.Element;
};

export interface changePasswordData {
      currentPassword: string,
      newPassword: string,
      confirmNewPassword: string
}