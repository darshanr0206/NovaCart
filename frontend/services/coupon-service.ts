import { api } from "@/lib/api";

export interface CouponValidateResult {
  valid: boolean;
  code: string;
  discountAmount: number;
  finalAmount: number;
  message: string;
  discountType?: string;
  discountPercent?: number;
  fixedDiscountAmount?: number;
}

export async function validateCoupon(code: string, amount: number): Promise<CouponValidateResult> {
  const { data } = await api.get("/coupons/validate", {
    params: { code, amount },
  });
  return data;
}
