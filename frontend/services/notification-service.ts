import { api } from "@/lib/api";
import { PageResponse } from "@/types";

export interface CustomerNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export async function getMyNotifications(page = 0, size = 20): Promise<PageResponse<CustomerNotification>> {
  const { data } = await api.get("/notifications", { params: { page, size } });
  return data;
}

export async function getRecentNotifications(): Promise<CustomerNotification[]> {
  const { data } = await api.get("/notifications/recent");
  return data || [];
}

export async function getUnreadCount(): Promise<number> {
  try {
    const { data } = await api.get("/notifications/unread-count");
    return data?.unreadCount || 0;
  } catch {
    return 0;
  }
}

export async function markAsRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
