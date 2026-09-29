"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyOrders } from "@/services/order-service";
import { useAuthStore } from "@/store/auth-store";
import { Order, OrderStatus } from "@/types";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/product/status-badge";
import {
  Package,
  Clock,
  CreditCard,
  ChevronRight,
  ShoppingBag,
  RefreshCw,
  Search,
  Truck,
  CheckCircle2,
  MapPin,
  ArrowRight
} from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const { user, hydrate, hydrated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchOrders = () => {
    setLoading(true);
    getMyOrders(0, 50)
      .then((res) => setOrders(res.content || []))
      .catch((err) => {
        console.error("Failed to load orders", err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push("/login"); return; }
    fetchOrders();
  }, [hydrated, user, router]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchQuery.trim() ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        String(order.id) === searchQuery.trim() ||
        order.items?.some((item) =>
          item.productName.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );

      const isReturnStatus = [
        "RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_REJECTED", "RETURNED", "REFUNDED"
      ].includes(order.status.toUpperCase()) || Boolean(order.returnRequest);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "RETURNS" && isReturnStatus) ||
        order.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  if (!hydrated || loading) {
    return (
      <div className="container-content py-24 text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-nova-600 mb-3" />
        <p className="text-graphite font-medium">Loading your orders from database…</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container-content flex flex-col items-center gap-4 py-24 text-center">
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-graphite mb-2">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-ink">No orders yet</h1>
        <p className="text-sm text-graphite max-w-sm">
          You haven&apos;t placed any orders yet. Discover our latest collections and start shopping!
        </p>
        <Link href="/products" className="btn-primary mt-2">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-content py-6 sm:py-12 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Your Orders & Tracking</h1>
          <p className="text-sm text-graphite mt-0.5">
            Logged in as <strong className="text-ink">{user?.fullName}</strong> ({user?.email}) · {orders.length} order(s) found
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          title="Refresh orders from database"
        >
          <RefreshCw className="h-3.5 w-3.5 text-nova-600" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order Number, ID, or product name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-line rounded-xl focus:outline-none focus:border-nova-500 shadow-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "OUT_FOR_DELIVERY", label: "🚚 Out for Delivery" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "RETURNS", label: "🔄 Returns & Refunds" },
            { id: "CONFIRMED", label: "Confirmed" },
            { id: "SHIPPED", label: "Shipped" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition border ${
                statusFilter === f.id
                  ? "bg-nova-600 text-white border-nova-600 shadow-xs"
                  : "bg-white text-graphite border-line hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm font-semibold text-ink">No matching orders found</p>
          <p className="text-xs text-graphite mt-1">Try clearing your search query or status filter.</p>
          <button
            onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
            className="btn-secondary text-xs mt-4"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const paymentStatus = order.paymentStatus || order.payment?.status || (order.status !== "PLACED" ? "SUCCESS" : "PENDING");
            const paymentMethod = order.paymentMethod || order.payment?.paymentMethod || "Razorpay";
            const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";

            return (
              <div
                key={order.id}
                className={`card p-6 block transition duration-200 border relative overflow-hidden ${
                  isOutForDelivery
                    ? "border-amber-400 bg-amber-50/10 shadow-md ring-1 ring-amber-400/30"
                    : "hover:border-nova-400 hover:shadow-md"
                }`}
              >
                {/* Out for Delivery Banner */}
                {isOutForDelivery && (
                  <div className="bg-amber-500 text-white text-[11px] font-bold px-3 py-1 flex items-center gap-1.5 -mx-6 -mt-6 mb-4">
                    <Truck className="h-3.5 w-3.5 animate-bounce" />
                    <span>OUT FOR DELIVERY — Expected to arrive today!</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-ink text-base tracking-tight">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          paymentStatus === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {paymentStatus === "SUCCESS" ? "PAID" : "PAYMENT PENDING"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-graphite flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-gray-400" />
                        {order.items?.length || 0} item(s)
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-indigo-700">
                        <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
                        {paymentMethod}
                      </span>
                    </div>

                    {/* Order Items Snapshot Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-slate-700 truncate">
                          <span className="font-semibold text-ink">{order.items[0].productName}</span>
                          {order.items.length > 1 && ` and ${order.items.length - 1} more item(s)`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-line gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-graphite block">Total Paid</span>
                      <span className="text-base font-black text-ink">{formatINR(order.total)}</span>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      <span>Track Order</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
