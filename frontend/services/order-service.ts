import { api } from "@/lib/api";
import { Order, PageResponse } from "@/types";

export async function createOrder(addressId: number, couponCode?: string, paymentMethod?: string): Promise<Order> {
  const { data } = await api.post("/orders", { addressId, couponCode, paymentMethod });
  return data;
}

export async function getMyOrders(page = 0, size = 10): Promise<PageResponse<Order>> {
  const { data } = await api.get("/orders", { params: { page, size } });
  return data;
}

export async function getOrder(id: number | string): Promise<Order> {
  const { data } = await api.get(`/orders/${id}`);
  return data;
}

export async function cancelOrder(id: number | string): Promise<Order> {
  const { data } = await api.post(`/orders/${id}/cancel`);
  return data;
}
