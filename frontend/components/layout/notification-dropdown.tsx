"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ShoppingBag,
  Truck,
  RotateCcw,
  CreditCard,
  Package,
  Sparkles,
  ExternalLink,
  RefreshCw,
  X
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import {
  CustomerNotification,
  getRecentNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from "@/services/notification-service";

export function NotificationDropdown() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const [list, count] = await Promise.all([
        getRecentNotifications(),
        getUnreadCount()
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.warn("Could not fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (hydrated && user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [hydrated, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) {
      fetchNotifs();
    }
  };

  const handleItemClick = async (notif: CustomerNotification) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!hydrated || !user) {
    return null;
  }

  const getIcon = (type?: string) => {
    switch (type) {
      case "ORDER":
        return <ShoppingBag className="h-4 w-4 text-indigo-600" />;
      case "SHIPPING":
      case "DELIVERY":
        return <Truck className="h-4 w-4 text-amber-600" />;
      case "RETURN":
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      case "REFUND":
        return <CreditCard className="h-4 w-4 text-emerald-600" />;
      default:
        return <Package className="h-4 w-4 text-nova-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative p-1 text-graphite hover:text-ink transition-colors"
      >
        <Bell className="h-5 w-5 stroke-[1.8]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 grid min-w-[16px] h-4 px-1 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-line shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-line">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-nova-600" />
              <span className="font-bold text-xs text-ink uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-nova-600 hover:text-nova-700 flex items-center gap-1 transition"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={fetchNotifs}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
                title="Refresh notifications"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-line/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-graphite space-y-2">
                <Bell className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="text-xs font-semibold text-ink">No notifications yet</p>
                <p className="text-[11px] text-gray-400">
                  Updates on your orders, returns, and refunds will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition cursor-pointer ${
                    notif.isRead ? "bg-white hover:bg-slate-50/80" : "bg-indigo-50/30 hover:bg-indigo-50/60"
                  }`}
                >
                  <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs truncate ${notif.isRead ? "font-semibold text-ink" : "font-bold text-ink"}`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-nova-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-graphite mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                      {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-line text-center">
            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold text-nova-600 hover:text-nova-700 inline-flex items-center gap-1"
            >
              <span>View All Orders & Tracking</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
