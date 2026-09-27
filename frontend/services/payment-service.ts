import { api } from "@/lib/api";

export interface CreateRazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  amountInPaise?: number;
  currency: string;
  keyId: string;
}

export async function createRazorpayOrder(orderId: number): Promise<CreateRazorpayOrderResponse> {
  const { data } = await api.post("/payments/create", { orderId });
  return data;
}

export async function verifyPayment(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  screenshotUrl?: string;
  paymentMethod?: string;
}) {
  const { data } = await api.post("/payments/verify", payload);
  return data as {
    status: string;
    orderId: number;
    orderNumber: string;
    paymentStatus: string;
    paymentMethod?: string;
    razorpayPaymentId?: string;
  };
}

export async function recordPaymentFailure(razorpayOrderId?: string, reason?: string) {
  try {
    const { data } = await api.post("/payments/fail", { razorpayOrderId, reason });
    return data;
  } catch (err) {
    // Non-blocking failure logging
    console.warn("Could not report payment failure to backend:", err);
    return null;
  }
}

export async function uploadPaymentScreenshot(file: File, orderId?: number, razorpayOrderId?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (orderId) formData.append("orderId", String(orderId));
  if (razorpayOrderId) formData.append("razorpayOrderId", razorpayOrderId);

  const { data } = await api.post("/payments/upload-screenshot", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as { url: string; status: string };
}
