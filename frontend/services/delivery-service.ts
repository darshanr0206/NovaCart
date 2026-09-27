import { api } from "@/lib/api";

export interface DeliveryOrder {
  id: number;
  status: "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED";
  pickupAddress?: string;
  deliveryAddress?: string;
  createdAt: string;
}

export async function getMyDeliveries(page = 0, size = 20) {
  const { data } = await api.get("/delivery/orders", { params: { page, size } });
  return data as { content: DeliveryOrder[] };
}

export async function updateDeliveryStatus(id: number, status: DeliveryOrder["status"]) {
  const { data } = await api.put(`/delivery/orders/${id}/status`, { status });
  return data;
}
