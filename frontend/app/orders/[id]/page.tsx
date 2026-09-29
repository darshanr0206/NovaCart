"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getOrder, cancelOrder, requestReturn } from "@/services/order-service";
import { useAuthStore } from "@/store/auth-store";
import { Order, OrderStatus } from "@/types";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/product/status-badge";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import {
  Package,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  ArrowLeft,
  Eye,
  ExternalLink,
  X,
  RefreshCw,
  Truck,
  Check,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  PackageCheck
} from "lucide-react";

const TRACKING_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "PLACED", label: "Order Placed", icon: "📝" },
  { status: "CONFIRMED", label: "Confirmed", icon: "✅" },
  { status: "PROCESSING", label: "Processing", icon: "⚙️" },
  { status: "PACKED", label: "Packed", icon: "📦" },
  { status: "SHIPPED", label: "Shipped", icon: "✈️" },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🚚" },
  { status: "DELIVERED", label: "Delivered", icon: "🎉" },
];

const RETURN_STATUSES: OrderStatus[] = [
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_REJECTED",
  "RETURNED",
  "REFUNDED"
];

const CANCELLABLE: OrderStatus[] = ["PLACED", "CONFIRMED", "PROCESSING"];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, hydrate, hydrated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchOrder = async () => {
    try {
      const data = await getOrder(params.id);
      setOrder(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load order details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push("/login"); return; }
    fetchOrder();
  }, [hydrated, user, router, params.id]);

  async function handleCancel() {
    if (!order) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not cancel this order"));
    } finally {
      setCancelling(false);
    }
  }

  async function handleReturnSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !returnReason.trim()) return;
    setSubmittingReturn(true);
    try {
      await requestReturn(order.id, {
        reason: returnReason.trim(),
        note: returnNote.trim() || undefined,
      });
      toast.success("Return request submitted successfully");
      setShowReturnModal(false);
      setReturnReason("");
      setReturnNote("");
      await fetchOrder();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to submit return request"));
    } finally {
      setSubmittingReturn(false);
    }
  }

  if (loading) {
    return (
      <div className="container-content py-24 text-center">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-nova-600 mb-3" />
        <p className="text-graphite font-medium">Fetching order status from database…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-content py-24 text-center">
        <h2 className="text-xl font-bold text-ink">Order Not Found</h2>
        <p className="text-sm text-graphite mt-1">We couldn&apos;t find this order in your account.</p>
        <Link href="/orders" className="btn-secondary mt-4 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const isReturnStatus = RETURN_STATUSES.includes(order.status) || Boolean(order.returnRequest);
  const currentStepIndex = isReturnStatus
    ? TRACKING_STEPS.length - 1
    : TRACKING_STEPS.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === "CANCELLED";
  const screenshot = order.paymentScreenshotUrl || order.payment?.screenshotUrl;
  const paymentStatus = order.paymentStatus || order.payment?.status || (order.status !== "PLACED" ? "SUCCESS" : "PENDING");
  const paymentId = order.payment?.razorpayPaymentId;
  const paymentMethod = order.paymentMethod || order.payment?.paymentMethod || "Razorpay";
  const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";

  return (
    <div className="container-content py-10 max-w-5xl">
      {/* Back Button */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite hover:text-ink mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to All Orders</span>
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-line shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-graphite">Order Number</span>
          <h1 className="text-2xl font-black text-ink tracking-tight mt-0.5">{order.orderNumber}</h1>
          <p className="text-xs text-graphite mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <button
            onClick={fetchOrder}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-xs"
            title="Refresh order status from database"
          >
            <RefreshCw className="h-3.5 w-3.5 text-nova-600" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Return & Refund Status Banner */}
      {isReturnStatus && (
        <div className="card mb-6 p-5 sm:p-6 bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-orange-500/5 border-2 border-amber-500/30 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  Return Status: <StatusBadge status={order.status} />
                </h3>
                <p className="text-xs text-graphite mt-0.5">
                  {order.status === "RETURN_REQUESTED" && "Your return request has been submitted and is under admin review."}
                  {order.status === "RETURN_APPROVED" && "Your return has been approved! Doorstep pickup and verification is being arranged."}
                  {order.status === "RETURN_REJECTED" && "Your return request could not be approved by the admin team."}
                  {order.status === "RETURNED" && "The returned item has been received and verified at our fulfillment center."}
                  {order.status === "REFUNDED" && "Your refund has been successfully completed!"}
                </p>
              </div>
            </div>
            {order.returnRequest?.createdAt && (
              <span className="text-[11px] text-graphite font-mono bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200/50">
                Requested: {new Date(order.returnRequest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          {/* Refund Tracking Information */}
          {(order.returnRequest?.refundStatus || order.status === "REFUNDED" || order.payment?.status === "REFUNDED") && (
            <div className="bg-white/90 rounded-xl p-4 border border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                  Refund Workflow Tracking
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    order.status === "REFUNDED" || order.returnRequest?.refundStatus === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.status === "REFUNDED" || order.returnRequest?.refundStatus === "COMPLETED"
                    ? "REFUND COMPLETED"
                    : order.returnRequest?.refundStatus || "REFUND INITIATED"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-graphite block text-[11px]">Refund Amount:</span>
                  <span className="font-bold text-ink text-sm">
                    {formatINR(order.returnRequest?.refundAmount || order.total)}
                  </span>
                </div>
                <div>
                  <span className="text-graphite block text-[11px]">Refund Destination:</span>
                  <span className="font-medium text-ink">
                    {order.returnRequest?.refundPaymentMethod === "RAZORPAY_ONLINE" || paymentMethod === "RAZORPAY"
                      ? "Original Bank Account / VPA"
                      : "Bank Transfer (COD Refund)"}
                  </span>
                </div>
                <div>
                  <span className="text-graphite block text-[11px]">Refund Reference ID:</span>
                  <span className="font-mono text-ink text-[11px] font-semibold">
                    {order.returnRequest?.refundTransactionId ||
                      order.payment?.razorpayRefundId ||
                      "Pending Gateway Dispatch"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Return Reason, Notes & Admin Comment */}
          {(order.returnRequest?.reason || order.returnRequest?.note || order.returnRequest?.adminComment) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {order.returnRequest.reason && (
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                  <span className="text-graphite font-semibold block mb-0.5">Return Reason:</span>
                  <span className="text-ink font-medium">{order.returnRequest.reason}</span>
                </div>
              )}
              {order.returnRequest.note && (
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/50">
                  <span className="text-graphite font-semibold block mb-0.5">Customer Note:</span>
                  <span className="text-ink font-medium italic">&quot;{order.returnRequest.note}&quot;</span>
                </div>
              )}
              {order.returnRequest.adminComment && (
                <div className="sm:col-span-2 bg-amber-50/80 p-3 rounded-xl border border-amber-300/50">
                  <span className="text-amber-900 font-bold block mb-0.5">Note from NovaCart Admin:</span>
                  <span className="text-amber-800">{order.returnRequest.adminComment}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Special Out For Delivery Hero Alert */}
      {isOutForDelivery && (
        <div className="bg-amber-500 text-white rounded-2xl p-5 mb-6 shadow-md flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Truck className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Out for Delivery!</h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Your order is currently with our delivery executive and is scheduled to be delivered today.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-white text-amber-900 font-bold px-3 py-1.5 rounded-xl shadow-xs">
            LIVE TRACKING ACTIVE
          </span>
        </div>
      )}

      {/* 7-Stage Tracking Stepper */}
      {!isCancelled && (
        <div className="card mb-8 p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xs font-bold text-graphite uppercase tracking-wider">
              Live Order Progress
            </h3>
            <span className="text-xs font-bold text-nova-700 bg-nova-50 px-2.5 py-0.5 rounded-full">
              {currentStepIndex >= 0 ? TRACKING_STEPS[currentStepIndex].label : order.status}
            </span>
          </div>

          {/* Desktop / Tablet Horizontal Stepper */}
          <div className="hidden sm:flex relative items-center justify-between py-4 px-2">
            {/* Background Line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-gray-200 -z-0 rounded-full" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-nova-600 to-amber-500 transition-all duration-500 -z-0 rounded-full"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (currentStepIndex / (TRACKING_STEPS.length - 1)) * 95)
                )}%`,
              }}
            />

            {TRACKING_STEPS.map((stepObj, i) => {
              const isCompleted = i <= currentStepIndex && currentStepIndex !== -1;
              const isCurrent = i === currentStepIndex;

              return (
                <div key={stepObj.status} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      isCurrent
                        ? "bg-amber-500 text-white ring-4 ring-amber-100 scale-110"
                        : isCompleted
                        ? "bg-nova-600 text-white ring-4 ring-nova-50"
                        : "bg-white text-gray-400 border-2 border-gray-300"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : i + 1}
                  </div>
                  <p
                    className={`mt-2.5 text-[11px] font-bold whitespace-nowrap ${
                      isCurrent
                        ? "text-amber-700 font-extrabold"
                        : isCompleted
                        ? "text-ink font-semibold"
                        : "text-gray-400"
                    }`}
                  >
                    {stepObj.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical Stepper */}
          <div className="sm:hidden space-y-3 py-1">
            {TRACKING_STEPS.map((stepObj, i) => {
              const isCompleted = i <= currentStepIndex && currentStepIndex !== -1;
              const isCurrent = i === currentStepIndex;

              return (
                <div key={stepObj.status} className="flex items-center gap-3">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                      isCurrent
                        ? "bg-amber-500 text-white ring-2 ring-amber-200"
                        : isCompleted
                        ? "bg-nova-600 text-white"
                        : "bg-slate-100 text-slate-400 border border-slate-300"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : i + 1}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? "text-amber-700 font-bold"
                          : isCompleted
                          ? "text-ink"
                          : "text-slate-400"
                      }`}
                    >
                      {stepObj.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                        In Progress
                      </span>
                    )}
                    {isCompleted && !isCurrent && (
                      <span className="text-[10px] text-emerald-600 font-semibold">Done</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ordered Items List (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-xs font-bold text-graphite uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-nova-600" />
              Order Items ({order.items?.length || 0})
            </h3>

            <div className="divide-y divide-line">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.productName}</p>
                    <p className="text-xs text-graphite mt-0.5">
                      Quantity: <span className="font-semibold text-ink">{item.quantity}</span> · Price: {formatINR(item.price)} each
                    </p>
                  </div>
                  <span className="text-sm font-bold text-ink whitespace-nowrap">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <div className="card p-6">
              <h3 className="text-xs font-bold text-graphite uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-nova-600" />
                Delivery Address
              </h3>
              <p className="text-sm text-ink">{order.deliveryAddress}</p>
            </div>
          )}
        </div>

        {/* Payment & Summary Sidebar (col-span-1) */}
        <div className="space-y-6">
          {/* Payment & Screenshot Card */}
          <div className="card p-6 bg-slate-50/50">
            <h3 className="text-xs font-bold text-graphite uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              Payment Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-graphite">Payment Mode</span>
                <span className="font-semibold text-ink">{paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-graphite">Payment Status</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                    paymentStatus === "SUCCESS"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {paymentStatus === "SUCCESS" ? "PAID (CONFIRMED)" : "PENDING"}
                </span>
              </div>

              {paymentId && (
                <div className="flex justify-between items-center">
                  <span className="text-graphite">Razorpay ID</span>
                  <span className="font-mono text-ink text-[11px] bg-white px-2 py-0.5 rounded border border-line">
                    {paymentId}
                  </span>
                </div>
              )}

              {/* Uploaded Screenshot Preview */}
              {screenshot ? (
                <div className="border-t border-line pt-3 mt-3">
                  <span className="text-[11px] font-bold text-graphite block mb-2">
                    Verified Payment Screenshot:
                  </span>
                  <div
                    onClick={() => setSelectedScreenshotUrl(screenshot)}
                    className="relative h-28 rounded-xl overflow-hidden border border-line bg-black/5 cursor-pointer group shadow-sm flex items-center justify-center"
                  >
                    <img
                      src={screenshot}
                      alt="Uploaded Screenshot"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>Click to Zoom</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="card p-6">
            <h3 className="text-xs font-bold text-graphite uppercase tracking-wider mb-4">
              Price Breakdown
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-graphite">
                <span>Subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-graphite">
                <span>Delivery Charge</span>
                <span className="text-emerald-600 font-medium">
                  {order.deliveryCharge === 0 ? "FREE" : formatINR(order.deliveryCharge)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Applied</span>
                  <span>-{formatINR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold text-ink">
                <span>Total Amount</span>
                <span>{formatINR(order.total)}</span>
              </div>
            </div>

            {CANCELLABLE.includes(order.status) && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-secondary mt-6 w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              >
                {cancelling ? "Cancelling…" : "Cancel Order"}
              </button>
            )}

            {/* Return Item Button: ONLY shown if order is successfully DELIVERED */}
            {order.status === "DELIVERED" && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="mt-4 w-full rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold py-2.5 px-4 flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
                <span>Return Item</span>
              </button>
            )}
          </div>
        </div>
      </div>

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
                Payment Confirmation Proof
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
                <span>Open Original in New Tab</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div
          onClick={() => !submittingReturn && setShowReturnModal(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-4 border-b border-line mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Request Return</h3>
                  <p className="text-xs text-graphite">Order #{order.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                disabled={submittingReturn}
                className="text-graphite hover:text-ink p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1.5">
                  Reason for Return <span className="text-rose-500">*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-nova-600 focus:outline-hidden focus:ring-1 focus:ring-nova-600 cursor-pointer"
                >
                  <option value="">Select a reason…</option>
                  <option value="Defective or damaged product">Defective or damaged product</option>
                  <option value="Wrong item delivered">Wrong item delivered</option>
                  <option value="Item does not match description">Item does not match description</option>
                  <option value="Missing parts or accessories">Missing parts or accessories</option>
                  <option value="Quality not as expected">Quality not as expected</option>
                  <option value="Size or fit issue">Size or fit issue</option>
                  <option value="Arrived too late">Arrived too late</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1.5">
                  Additional Notes / Details <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  rows={3}
                  placeholder="Provide any additional details about the issue…"
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-gray-400 focus:border-nova-600 focus:outline-hidden focus:ring-1 focus:ring-nova-600 resize-none"
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-graphite space-y-1">
                <p className="font-semibold text-ink">Return Policy Summary:</p>
                <p>Eligible delivered orders can be returned within standard return window. Please ensure item is unused and kept in original condition with all accessories.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  disabled={submittingReturn}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn || !returnReason.trim()}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                >
                  {submittingReturn ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <span>Submit Return Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
