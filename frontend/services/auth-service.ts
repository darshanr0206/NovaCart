import { api } from "@/lib/api";
import { AuthUser } from "@/types";

export async function registerCustomer(payload: { fullName: string; email: string; phone?: string; password: string }): Promise<AuthUser> {
  const { data } = await api.post("/auth/register", payload);
  return mapAuthResponse(data);
}

export async function login(payload: { email: string; password: string }): Promise<AuthUser> {
  const { data } = await api.post("/auth/login", payload);
  return mapAuthResponse(data);
}

export async function sendOtp(phone: string): Promise<{
  success: boolean;
  phone: string;
  isExistingUser: boolean;
  message: string;
  resendInSeconds: number;
  devOtp?: string;
}> {
  const { data } = await api.post("/auth/send-otp", { phone });
  return data;
}

export async function verifyOtp(payload: { phone: string; otp: string; fullName?: string }): Promise<AuthUser> {
  const { data } = await api.post("/auth/verify-otp", payload);
  return mapAuthResponse(data);
}

export async function getProfile() {
  const { data } = await api.get("/users/me");
  return data;
}

export async function updateProfile(payload: {
  fullName: string;
  email?: string;
  phone?: string;
}): Promise<{
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  roles?: string[];
  active?: boolean;
  createdAt?: string;
  /** Present only when the email was changed — contains fresh JWT tokens. */
  accessToken?: string;
  refreshToken?: string;
}> {
  const { data } = await api.put("/users/me", payload);
  return data;
}

export async function forgotPassword(email: string) {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string) {
  await api.post("/auth/reset-password", { token, newPassword });
}

function mapAuthResponse(data: any): AuthUser {
  return {
    userId: data.userId,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    roles: data.roles,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}
