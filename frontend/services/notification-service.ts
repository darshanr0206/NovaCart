import { api } from "@/lib/api";

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get("/notifications");
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await api.get("/notifications/unread-count");
  return data?.count || 0;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.put("/notifications/read-all");
}
