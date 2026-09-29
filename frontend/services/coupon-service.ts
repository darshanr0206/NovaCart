import { api } from "@/lib/api";

export interface CouponResponse {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  discountPercent?: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  expiryDate: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  expired: boolean;
}

export interface CouponValidateResponse {
  valid: boolean;
  code: string;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  discountAmount?: number;
  finalTotal?: number;
  message?: string;
}

export async function getActiveCoupons(): Promise<CouponResponse[]> {
  const { data } = await api.get("/coupons/active");
  return data || [];
}

export async function validateCoupon(code: string, amount: number): Promise<CouponValidateResponse> {
  const { data } = await api.post("/coupons/validate", { code, amount });
  return data;
}
