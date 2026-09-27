"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  AppNotification,
} from "@/services/notification-service";
import { ArrowLeft, Bell, CheckCheck, Package, RotateCcw, CreditCard, Info } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, hydrated, hydrate } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login?redirect=/account/notifications");
      return;
    }
    if (hydrated && user) {
      fetchNotifs();
    }
  }, [hydrated, user, router, fetchNotifs]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const getIconForType = (type: string) => {
    if (type?.includes("RETURN")) {
      return <RotateCcw className="h-5 w-5 text-amber-600" />;
    }
    if (type?.includes("REFUND")) {
      return <CreditCard className="h-5 w-5 text-emerald-600" />;
    }
    if (type?.includes("ORDER") || type?.includes("SHIPPED") || type?.includes("DELIVERY")) {
      return <Package className="h-5 w-5 text-blue-600" />;
    }
    return <Info className="h-5 w-5 text-violet-600" />;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-6 sm:py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Updates on your returns, refunds, shipments and orders
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">Loading notifications…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center px-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Bell className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">No notifications yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                When you request a return, receive a refund, or your orders are shipped, you will get updates here.
              </p>
              <Link href="/orders" className="btn-primary mt-4 inline-flex items-center text-xs">
                View My Orders
              </Link>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={`p-4 sm:p-5 flex items-start gap-4 transition hover:bg-slate-50/80 cursor-pointer ${
                  !notif.read ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                  {getIconForType(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 mt-2"
                    >
                      View Details →
                    </Link>
                  )}
                </div>

                {!notif.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
