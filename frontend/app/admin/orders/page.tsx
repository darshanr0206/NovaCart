"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAdminOrders, updateAdminOrderStatus } from "@/services/admin-service";
import { useAuthStore } from "@/store/auth-store";
import { Order, OrderStatus } from "@/types";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/product/status-badge";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  MapPin,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Image as ImageIcon,
  ExternalLink,
  X,
  Eye
} from "lucide-react";

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All Orders", value: "ALL" },
  { label: "Order Placed", value: "PLACED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Packed", value: "PACKED" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const ORDER_LIFECYCLE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PLACED", label: "Order Placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "PACKED", label: "Packed" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { status: "DELIVERED", label: "Delivered" },
];

const NEXT_STAGE_MAP: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  PLACED: { next: "CONFIRMED", label: "Confirm Order" },
  CONFIRMED: { next: "PROCESSING", label: "Start Processing" },
  PROCESSING: { next: "PACKED", label: "Mark as Packed" },
  PACKED: { next: "SHIPPED", label: "Ship Order" },
  SHIPPED: { next: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  OUT_FOR_DELIVERY: { next: "DELIVERED", label: "Mark Delivered" },
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, hasRole, hydrate, hydrated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAdminOrders(0, 100);
      setOrders(res.content || []);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      toast.error(getApiErrorMessage(error, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!user || !hasRole("ADMIN")) {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [hydrated, user, hasRole, router]);

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      const updatedOrder = await updateAdminOrderStatus(orderId, newStatus);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updatedOrder, status: newStatus } : o))
      );
      toast.success(`Order status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update order status"));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Filter by tab
    if (activeTab !== "ALL" && order.status !== activeTab) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber?.toLowerCase().includes(q);
      const matchCustomer = order.customerName?.toLowerCase().includes(q);
      const matchEmail = order.customerEmail?.toLowerCase().includes(q);
      const matchPayment = order.payment?.razorpayPaymentId?.toLowerCase().includes(q) ||
                           order.payment?.razorpayOrderId?.toLowerCase().includes(q);
      const matchItem = order.items?.some((i) => i.productName?.toLowerCase().includes(q));
      return matchNum || matchCustomer || matchEmail || matchPayment || matchItem;
    }

    return true;
  });

  if (!hydrated || (loading && orders.length === 0)) {
    return (
      <div className="container-content py-24 text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-nova-600 mb-3" />
        <p className="text-graphite font-medium">Loading system orders…</p>
      </div>
    );
  }

  return (
    <div className="container-content py-10 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink tracking-tight">Orders Management</h1>
            <span className="rounded-full bg-nova-100 text-nova-800 text-xs font-semibold px-2.5 py-0.5">
              Admin
            </span>
          </div>
          <p className="text-sm text-graphite mt-1">
            Track customer orders, verify Razorpay payment screenshots, and manage the 7-stage fulfillment lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin" className="btn-secondary text-xs py-2 px-3">
            Admin Dashboard
          </Link>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Refresh orders list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-line p-4 mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order # (NC...), customer name, email, payment ID, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/70 border border-line rounded-lg focus:outline-none focus:border-nova-500 focus:bg-white transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === "ALL"
                ? orders.length
                : orders.filter((o) => o.status === tab.value).length;

            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  isActive
                    ? "bg-ink text-white shadow-sm"
                    : "bg-gray-100/80 text-graphite hover:bg-gray-200/70 hover:text-ink"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-200 text-graphite"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-line p-16 text-center shadow-sm">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-ink">No orders found</h3>
          <p className="text-xs text-graphite mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No orders matched your search "${searchQuery}".`
              : activeTab !== "ALL"
              ? `There are no orders with status "${activeTab}".`
              : "No customer orders have been placed yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const currentStepIdx = ORDER_LIFECYCLE_STEPS.findIndex((s) => s.status === order.status);
            const nextStage = NEXT_STAGE_MAP[order.status];
            const isUpdating = updatingId === order.id;
            const screenshot = order.paymentScreenshotUrl || order.payment?.screenshotUrl;
            const paymentId = order.payment?.razorpayPaymentId;
            const paymentStatus = order.paymentStatus || order.payment?.status || (order.status !== "PLACED" ? "SUCCESS" : "PENDING");

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-line shadow-sm overflow-hidden hover:border-gray-300 transition duration-150"
              >
                {/* Card Top Bar */}
                <div className="bg-slate-50/80 px-6 py-4 border-b border-line flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-xs font-semibold text-graphite block uppercase tracking-wider">
                        Order Number
                      </span>
                      <span className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
                        {order.orderNumber}
                      </span>
                    </div>

                    <div className="h-8 w-px bg-line hidden sm:block" />

                    <div>
                      <span className="text-xs font-semibold text-graphite block uppercase tracking-wider">
                        Date Placed
                      </span>
                      <span className="text-sm font-medium text-ink flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(order.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <div className="h-8 w-px bg-line hidden sm:block" />

                    <div>
                      <span className="text-xs font-semibold text-graphite block uppercase tracking-wider">
                        Customer
                      </span>
                      <span className="text-sm font-medium text-ink flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-nova-600" />
                        <span className="capitalize font-semibold">{order.customerName || "Customer"}</span>
                        {order.customerEmail && (
                          <span className="text-xs text-graphite font-normal">({order.customerEmail})</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-base font-bold text-ink ml-1">{formatINR(order.total)}</span>
                  </div>
                </div>

                {/* 7-Stage Progress Stepper */}
                {order.status !== "CANCELLED" && (
                  <div className="px-6 py-4 bg-slate-50/40 border-b border-line/60">
                    <div className="flex items-center justify-between relative">
                      {/* Connection Line */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-gray-200 -z-0" />
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-nova-500 transition-all duration-300 -z-0"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, (currentStepIdx / (ORDER_LIFECYCLE_STEPS.length - 1)) * 100)
                          )}%`,
                        }}
                      />

                      {ORDER_LIFECYCLE_STEPS.map((stepObj, idx) => {
                        const isCompleted = idx <= currentStepIdx && currentStepIdx !== -1;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={stepObj.status} className="flex flex-col items-center relative z-10">
                            <div
                              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                                isCompleted
                                  ? "bg-nova-600 text-white ring-4 ring-white"
                                  : "bg-white text-gray-400 border border-gray-300"
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                                isCurrent
                                  ? "text-nova-700 font-bold"
                                  : isCompleted
                                  ? "text-ink"
                                  : "text-gray-400"
                              }`}
                            >
                              {stepObj.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Card Body: Items & Payment & Actions */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Items & Delivery (col-span-2) */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-graphite uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      Order Items ({order.items?.length || 0})
                    </h4>

                    <div className="divide-y divide-line/70 border border-line rounded-lg overflow-hidden bg-white">
                      {order.items?.map((item) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink line-clamp-1">{item.productName}</p>
                            <p className="text-xs text-graphite mt-0.5">
                              Quantity: <span className="font-semibold text-ink">{item.quantity}</span> · Unit Price: {formatINR(item.price)}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-ink whitespace-nowrap">
                            {formatINR(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryAddress && (
                      <div className="flex items-start gap-2 text-xs text-graphite bg-gray-50 p-3 rounded-lg border border-line/60">
                        <MapPin className="h-4 w-4 text-nova-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-ink">Delivery Address: </span>
                          <span>{order.deliveryAddress}</span>
                        </div>
                      </div>
                    )}

                    {/* Payment & Screenshot Card */}
                    <div className="bg-indigo-50/40 rounded-xl border border-indigo-100 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-indigo-600" />
                          Payment & Verification
                        </h5>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            paymentStatus === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {paymentStatus === "SUCCESS" ? "PAID (SUCCESS)" : "PENDING"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-graphite">
                        <div>
                          <span className="font-medium">Gateway:</span> Razorpay Secure
                        </div>
                        {paymentId && (
                          <div>
                            <span className="font-medium">Payment ID:</span>{" "}
                            <span className="font-mono text-ink font-semibold">{paymentId}</span>
                          </div>
                        )}
                        {order.payment?.razorpayOrderId && (
                          <div>
                            <span className="font-medium">Razorpay Order:</span>{" "}
                            <span className="font-mono text-ink">{order.payment.razorpayOrderId}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Amount:</span>{" "}
                          <span className="font-bold text-ink">{formatINR(order.total)}</span>
                        </div>
                      </div>

                      {/* Screenshot Section */}
                      <div className="border-t border-indigo-100/80 pt-3">
                        <span className="text-[11px] font-bold text-indigo-900 block mb-2">
                          Customer Payment Screenshot:
                        </span>

                        {screenshot ? (
                          <div className="flex items-center gap-4">
                            <div
                              onClick={() => setSelectedScreenshotUrl(screenshot)}
                              className="relative h-20 w-28 rounded-lg overflow-hidden border border-indigo-200 bg-black/5 cursor-pointer group shadow-sm shrink-0"
                            >
                              <img
                                src={screenshot}
                                alt="Payment Screenshot"
                                className="h-full w-full object-cover group-hover:scale-105 transition duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                <span>Zoom</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <button
                                onClick={() => setSelectedScreenshotUrl(screenshot)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View Full Screenshot</span>
                              </button>
                              <a
                                href={screenshot}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-graphite hover:text-ink flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Open in new tab</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-graphite bg-white/70 p-2.5 rounded-lg border border-line flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                            <span>No payment screenshot attached for this order.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Lifecycle Controller (col-span-1) */}
                  <div className="bg-gray-50/60 p-5 rounded-xl border border-line flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-graphite uppercase tracking-wider mb-3">
                        Fulfillment Actions
                      </h4>

                      {/* Quick Advance Button */}
                      {nextStage && order.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, nextStage.next)}
                          disabled={isUpdating}
                          className="w-full btn-primary text-xs py-2.5 mb-4 flex items-center justify-center gap-2 shadow-sm"
                        >
                          {isUpdating ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <span>Advance to {nextStage.label}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      )}

                      {/* Set Order Status Directly */}
                      <div className="mb-4">
                        <label className="text-[11px] font-bold text-graphite block mb-1">
                          Change Lifecycle Status:
                        </label>
                        <select
                          value={order.status}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className="w-full text-xs bg-white border border-line rounded-lg px-2.5 py-2 text-ink font-semibold focus:outline-none focus:border-nova-500"
                        >
                          <option value="PLACED">1. Order Placed</option>
                          <option value="CONFIRMED">2. Confirmed</option>
                          <option value="PROCESSING">3. Processing</option>
                          <option value="PACKED">4. Packed</option>
                          <option value="SHIPPED">5. Shipped</option>
                          <option value="OUT_FOR_DELIVERY">6. Out for Delivery</option>
                          <option value="DELIVERED">7. Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>

                      {/* Price Breakdown */}
                      <div className="border-t border-line pt-3 space-y-1.5 text-xs text-graphite">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{formatINR(order.subtotal || order.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery</span>
                          <span>{order.deliveryCharge ? formatINR(order.deliveryCharge) : "Free"}</span>
                        </div>
                        {order.discount ? (
                          <div className="flex justify-between text-emerald-600">
                            <span>Discount</span>
                            <span>-{formatINR(order.discount)}</span>
                          </div>
                        ) : null}
                        <div className="flex justify-between border-t border-line pt-2 text-sm font-bold text-ink">
                          <span>Total Amount</span>
                          <span>{formatINR(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshotUrl && (
        <div
          onClick={() => setSelectedScreenshotUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
          >
            <div className="flex items-center justify-between p-4 border-b border-line bg-slate-50">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                Payment Screenshot Preview
              </h3>
              <button
                onClick={() => setSelectedScreenshotUrl(null)}
                className="text-graphite hover:text-ink p-1 rounded-lg hover:bg-gray-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-black/5 min-h-[300px]">
              <img
                src={selectedScreenshotUrl}
                alt="Payment Screenshot Full"
                className="max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="p-3 border-t border-line bg-slate-50 flex justify-end">
              <a
                href={selectedScreenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Original</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
