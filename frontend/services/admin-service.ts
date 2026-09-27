import { api } from "@/lib/api";
import { PageResponse } from "@/types";

export async function getAdminDashboard() {
  const { data } = await api.get("/admin/dashboard");
  return data as Record<string, number>;
}

export interface SellerAdmin {
  id: number;
  businessName: string;
  businessEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  createdAt: string;
}

export async function getSellers(status?: string, page = 0, size = 20): Promise<PageResponse<SellerAdmin>> {
  const { data } = await api.get("/admin/sellers", { params: { status, page, size } });
  return data;
}

export async function approveSeller(id: number) {
  const { data } = await api.put(`/admin/sellers/${id}/approve`);
  return data;
}

export async function rejectSeller(id: number) {
  const { data } = await api.put(`/admin/sellers/${id}/reject`);
  return data;
}

export async function getAdminOrders(page = 0, size = 50) {
  const { data } = await api.get("/admin/orders", { params: { page, size } });
  return data;
}

export async function updateAdminOrderStatus(orderId: number, status: string) {
  const { data } = await api.put(`/admin/orders/${orderId}/status`, { status });
  return data;
}

