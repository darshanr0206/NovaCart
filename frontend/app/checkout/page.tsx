"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { getCart, addToCart } from "@/services/cart-service";
import { getAddresses, createAddress } from "@/services/address-service";
import { createOrder } from "@/services/order-service";
import {
  createRazorpayOrder,
  verifyPayment,
  recordPaymentFailure,
  CreateRazorpayOrderResponse,
} from "@/services/payment-service";
import { formatINR } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import { Address } from "@/types";
import { validateCoupon, CouponValidateResult } from "@/services/coupon-service";
import { toast } from "sonner";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Lock,
  Smartphone,
  Building,
  QrCode,
  Zap,
  Tag,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Check,
  ArrowLeft,
  Banknote,
  Gift,
  Calendar,
  ChevronUp,
  ChevronDown,
  Clock,
  Info,
  MapPin,
  FlaskConical,
} from "lucide-react";
import {
  GooglePayLogo,
  GooglePayIcon,
  PhonePeLogo,
  PhonePeIcon,
  PaytmLogo,
  PaytmIcon,
  BhimUpiLogo,
  BhimUpiIcon,
  OfficialUpiLogo,
  VisaLogo,
  MastercardLogo,
  RuPayLogo,
} from "@/components/payment/payment-icons";
import {
  GooglePayCircle,
  PhonePeCircle,
  PaytmCircle,
  BhimUpiCircle,
} from "@/components/payment/upi-app-circles";
import { PaymentQrCode } from "@/components/payment/qr-code";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentMethodType = "UPI" | "CARD" | "COD" | "GIFTCARD" | "EMI";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, hydrated, hydrate } = useAuthStore();
  const { cart, setCart, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipientName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    label: "Home",
    isDefault: false,
  });

  // Flow states
  const [placing, setPlacing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("UPI");
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [activeRazorpayData, setActiveRazorpayData] = useState<CreateRazorpayOrderResponse | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [isCancelledNotice, setIsCancelledNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Flipkart-style Price Accordion & Timer
  const [showDiscounts, setShowDiscounts] = useState(true);
  const [timeLeft, setTimeLeft] = useState(264); // 04:24 minutes matching screenshot!
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardPin, setGiftCardPin] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateResult | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    if (!cart?.total) {
      toast.error("Cart is empty");
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await validateCoupon(couponInput.trim(), cart.total);
      if (res.valid) {
        setAppliedCoupon(res);
        toast.success(res.message || "Coupon applied successfully!");
      } else {
        toast.error(res.message || "Invalid coupon");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid coupon code");
    } finally {
      setValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.info("Coupon removed");
  }

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutesStr = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secondsStr = String(timeLeft % 60).padStart(2, "0");
  const timerProgress = Math.max(0, Math.min(100, (timeLeft / 300) * 100));

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }

    const loadData = async () => {
      // 1. Load or sync cart
      try {
        let serverCart = await getCart();
        const localCart = useCartStore.getState().cart;
        if ((!serverCart?.items || serverCart.items.length === 0) && localCart?.items && localCart.items.length > 0) {
          for (const item of localCart.items) {
            try {
              serverCart = await addToCart(item.productId, item.quantity);
            } catch (err) {
              console.warn("Could not sync item to server cart:", err);
            }
          }
        }
        if (serverCart) {
          setCart(serverCart);
        }
      } catch (err) {
        console.error("Failed loading/syncing cart:", err);
      }

      // 2. Load permanently saved addresses from PostgreSQL
      try {
        const addrs = await getAddresses();
        setAddresses(addrs);

        const storedId = localStorage.getItem("novacart_selected_address_id");
        const match = storedId ? addrs.find((a) => String(a.id) === storedId) : null;
        const target = match || addrs.find((a) => a.isDefault) || addrs[0];

        if (target) {
          setSelectedAddressId(target.id);
          localStorage.setItem("novacart_selected_address_id", String(target.id));
          setShowNewAddress(false);
        } else {
          setShowNewAddress(true);
          setShowAddressPicker(true);
        }
      } catch (err) {
        console.error("Failed loading saved addresses:", err);
      }
    };

    loadData();
  }, [hydrated, user, router, setCart]);

  async function handleSaveAddress() {
    if (
      !newAddress.recipientName.trim() ||
      !newAddress.phone.trim() ||
      !newAddress.line1.trim() ||
      !newAddress.city.trim() ||
      !newAddress.state.trim() ||
      !newAddress.postalCode.trim() ||
      !newAddress.country.trim()
    ) {
      toast.error("Please fill in all required fields, including your phone number.");
      return;
    }

    try {
      const saved = await createAddress({
        ...newAddress,
        isDefault: newAddress.isDefault || addresses.length === 0,
      });
      setAddresses((prev) => [...prev, saved]);
      setSelectedAddressId(saved.id);
      localStorage.setItem("novacart_selected_address_id", String(saved.id));
      setShowNewAddress(false);
      setShowAddressPicker(false);
      setNewAddress({
        recipientName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        label: "Home",
        isDefault: false,
      });
      toast.success("Address saved permanently!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save address"));
    }
  }

  // Launch authentic Razorpay Modal directly
  const launchRazorpayModal = useCallback(
    async (
      order: any,
      rpData: CreateRazorpayOrderResponse,
      preferredMethod: PaymentMethodType
    ) => {
      if (typeof window === "undefined" || !window.Razorpay) {
        toast.error("Razorpay SDK is still loading. Please try again in a few seconds.");
        return;
      }

      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      const amountInPaise = rpData.amountInPaise || Math.round(order.total * 100);

      let methodLabel = "Razorpay Direct";
      if (preferredMethod === "UPI") {
        methodLabel = "UPI (Direct QR / App)";
      } else if (preferredMethod === "CARD") {
        methodLabel = "Credit/Debit Card";
      }

      const options: any = {
        key: rpData.keyId,
        amount: amountInPaise,
        currency: rpData.currency || "INR",
        name: "NovaCart Marketplace",
        description: `Order #${order.orderNumber}`,
        image: "https://cdn-icons-png.flaticon.com/512/3081/3081840.png",
        order_id: rpData.razorpayOrderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          setVerifying(true);
          try {
            const result = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: methodLabel,
            });

            clearCart();
            setConfirmedOrder({
              ...order,
              id: result.orderId || order.id,
              orderNumber: result.orderNumber || order.orderNumber,
              paymentStatus: "SUCCESS",
              paymentMethod: methodLabel,
              razorpayPaymentId: response.razorpay_payment_id,
            });
            toast.success("Payment verified and order confirmed! 🎉");
          } catch (err) {
            console.error("Verification error:", err);
            const msg = getApiErrorMessage(err, "Payment signature verification failed");
            setErrorMessage(msg);
            toast.error(msg);
          } finally {
            setVerifying(false);
          }
        },
        prefill: {
          name: selectedAddress?.recipientName || user?.fullName || "",
          email: user?.email || "",
          contact: selectedAddress?.phone || "",
          method: preferredMethod === "UPI" ? "upi" : preferredMethod === "CARD" ? "card" : undefined,
        },
        notes: {
          orderId: String(order.id),
          orderNumber: order.orderNumber,
          paymentFlow: "Flipkart_Style_Direct",
        },
        theme: {
          color: "#2563EB",
          backdrop_color: "rgba(15, 23, 42, 0.75)",
        },
        modal: {
          ondismiss: function () {
            recordPaymentFailure(rpData.razorpayOrderId, "Cancelled by user");
            setIsCancelledNotice(true);
            toast.info("Payment window closed. You can retry anytime.");
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          console.warn("Payment failed on gateway:", response.error);
          const failReason = response.error?.description || "Transaction failed or declined by issuing bank.";
          setErrorMessage(failReason);
          recordPaymentFailure(rpData.razorpayOrderId, failReason);
          toast.error(`Payment failed: ${failReason}`);
        });
        rzp.open();
      } catch (err: any) {
        console.error("Error opening Razorpay checkout:", err);
        toast.error("Failed to open Razorpay modal: " + (err?.message || "Unknown error"));
      }
    },
    [addresses, selectedAddressId, user, clearCart]
  );

  // Handle Starting or Retrying Direct Payment
  async function handleProceedToPayment() {
    if (!selectedAddressId) {
      toast.error("Please select or add a delivery address first.");
      setShowAddressPicker(true);
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      toast.error("Your cart is empty");
      router.push("/products");
      return;
    }

    // Ensure server has all local items before creating order
    try {
      let serverCart = await getCart();
      if (!serverCart.items || serverCart.items.length === 0) {
        for (const item of cart.items) {
          await addToCart(item.productId, item.quantity);
        }
      }
    } catch {
      // Proceed to createOrder
    }

    if (selectedMethod === "COD") {
      setPlacing(true);
      try {
        const order = await createOrder(selectedAddressId, appliedCoupon?.code || undefined, "COD");
        clearCart();
        toast.success("Order placed with Cash on Delivery! 📦");
        router.push(`/orders/${order.id}`);
        return;
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Failed placing Cash on Delivery order"));
      } finally {
        setPlacing(false);
      }
      return;
    }

    setPlacing(true);
    setErrorMessage(null);
    setIsCancelledNotice(false);

    try {
      let order = activeOrder;
      if (!order) {
        order = await createOrder(selectedAddressId, appliedCoupon?.code || undefined, "RAZORPAY");
        setActiveOrder(order);
      }

      const rpData = await createRazorpayOrder(order.id);
      setActiveRazorpayData(rpData);
      await launchRazorpayModal(order, rpData, selectedMethod);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Could not initiate payment with Razorpay");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  }

  async function handleRetryPayment() {
    if (!activeOrder) {
      handleProceedToPayment();
      return;
    }

    setPlacing(true);
    try {
      const rpData = activeRazorpayData || (await createRazorpayOrder(activeOrder.id));
      setActiveRazorpayData(rpData);
      await launchRazorpayModal(activeOrder, rpData, selectedMethod);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not retry payment"));
    } finally {
      setPlacing(false);
    }
  }

  // ─── ORDER CONFIRMED SCREEN (PAID DIRECTLY VIA RAZORPAY OR COD) ───
  if (confirmedOrder) {
    return (
      <div className="min-h-[85vh] bg-[#F1F3F6] py-8 sm:py-16 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-sm text-center relative overflow-hidden">
          <div className="h-20 w-20 bg-emerald-50 border-4 border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Check className="h-10 w-10 stroke-[3]" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Verified Order
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-4 tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Order <strong className="text-slate-900 font-bold">#{confirmedOrder.orderNumber}</strong> has been confirmed.
          </p>

          <div className="mt-8 bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 text-left space-y-3.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Order Number</span>
              <span className="font-mono font-bold text-slate-900">{confirmedOrder.orderNumber}</span>
            </div>

            {confirmedOrder.paymentMethod && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Payment Method</span>
                <span className="font-semibold text-slate-900">{confirmedOrder.paymentMethod}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Status</span>
              <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {confirmedOrder.status || "PLACED"}
              </span>
            </div>

            <div className="flex justify-between items-center text-base font-extrabold text-slate-900 border-t border-slate-200 pt-3.5">
              <span>Total</span>
              <span className="text-emerald-700">{formatINR(confirmedOrder.total)}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link
              href={`/orders/${confirmedOrder.id}`}
              className="btn-primary flex items-center justify-center gap-2 py-3.5 px-6 shadow-md shadow-blue-600/10"
            >
              <span>Track Order Status</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/products" className="btn-secondary py-3.5 px-6">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hydrated || !cart) {
    return (
      <div className="min-h-[70vh] bg-[#F1F3F6] py-24 text-center text-graphite flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Loading checkout…</p>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#F1F3F6] py-24 text-center text-graphite flex flex-col items-center justify-center gap-4 px-4">
        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-xs border border-line mx-auto">
          <ShoppingBag className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-ink">Your cart is empty</h1>
        <p className="text-xs text-graphite max-w-sm">You have no items in your cart. Add products before proceeding to checkout.</p>
        <Link href="/products" className="btn-primary mt-2">
          Explore Products
        </Link>
      </div>
    );
  }

  // ─── VERIFYING SPINNER OVERLAY ───
  if (verifying) {
    return (
      <div className="min-h-[70vh] bg-[#F1F3F6] py-24 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
        <div className="h-16 w-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-xs">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Verifying Payment Signature…</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Please wait while the NovaCart backend verifies the cryptographic signature with Razorpay.
        </p>
      </div>
    );
  }

  // Calculations for Price Summary
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalAmount = Math.max(0, cart.total - couponDiscount);
  const estimatedMrp = Math.round(cart.total * 1.142);
  const discountAmount = estimatedMrp - cart.total;

  // Selected Address Details
  const activeAddr = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  // Dynamic UPI URI string for QR code
  const upiIntentString = `upi://pay?pa=novacart@razorpay&pn=NovaCart+Marketplace&am=${totalAmount.toFixed(2)}&cu=INR&tn=Order+Payment`;

  return (
    <div className="min-h-screen bg-[#F1F3F6] py-6 sm:py-8 px-3 sm:px-6 animate-fade-in font-sans">
      {/* Load Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-6xl mx-auto space-y-4">
        {/* Compact Delivery Address Strip */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 min-w-0">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
            {activeAddr ? (
              <div className="truncate">
                <span className="font-bold text-slate-900">Deliver to: {activeAddr.recipientName}</span>
                <span className="text-slate-500 ml-1.5 truncate">
                  ({activeAddr.line1}, {activeAddr.city} - {activeAddr.postalCode})
                </span>
              </div>
            ) : (
              <span className="text-amber-600 font-semibold">No delivery address selected</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowAddressPicker(!showAddressPicker)}
            className="text-blue-600 hover:text-blue-700 font-bold ml-3 shrink-0 uppercase tracking-wider text-[11px]"
          >
            {showAddressPicker ? "Close" : "Change"}
          </button>
        </div>

        {/* Expandable Address Picker if toggled */}
        {showAddressPicker && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Select Delivery Address</h3>
              <button
                type="button"
                onClick={() => setShowNewAddress(!showNewAddress)}
                className="text-xs font-bold text-blue-600"
              >
                {showNewAddress ? "Cancel" : "+ Add New Address"}
              </button>
            </div>

            {showNewAddress && (
              <div className="grid gap-3 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  placeholder="Recipient name *"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white"
                  value={newAddress.recipientName}
                  onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                />
                <input
                  placeholder="Phone number *"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                />
                <input
                  placeholder="Address line 1 *"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white sm:col-span-2"
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                />
                <input
                  placeholder="City *"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
                <input
                  placeholder="State *"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                />
                <input
                  placeholder="Postal code *"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white"
                  value={newAddress.postalCode}
                  onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                />
                <div className="sm:col-span-2 flex gap-2 pt-1">
                  <button onClick={handleSaveAddress} className="btn-primary !py-2 text-xs flex-1">
                    Save Address
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer text-xs transition ${
                    selectedAddressId === addr.id
                      ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="radio"
                      name="addressSelection"
                      checked={selectedAddressId === addr.id}
                      onChange={() => {
                        setSelectedAddressId(addr.id);
                        localStorage.setItem("novacart_selected_address_id", String(addr.id));
                        setShowAddressPicker(false);
                      }}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{addr.recipientName}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-slate-600 block mt-0.5">
                        {addr.line1}, {addr.city} - {addr.postalCode}
                      </span>
                      <span className="text-slate-500 block text-[11px] mt-0.5">Phone: {addr.phone}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notices */}
        {isCancelledNotice && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Payment modal closed. You can retry with the QR code or direct payment.</span>
            </div>
            {activeOrder && (
              <button
                onClick={handleRetryPayment}
                disabled={placing}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg text-xs"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center gap-2 text-rose-900 text-xs">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ─── MAIN COMPLETE PAYMENT CARD (EXACT FLIPKART LAYOUT) ─── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/cart")}
                className="p-1.5 -ml-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition"
                title="Back to Cart"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="font-bold text-lg text-slate-900">Complete Payment</h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
                <span>Sandbox / Demo Mode</span>
              </span>
              <div className="flex items-center gap-1.5 bg-slate-100/90 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
                <Lock className="h-3.5 w-3.5 text-slate-600" />
                <span>100% Secure</span>
              </div>
            </div>
          </div>

          {/* 3-Column Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
            {/* ── COLUMN 1: PAYMENT METHOD MENU (lg:col-span-4) ── */}
            <div className="lg:col-span-4 space-y-2.5">
              {/* Cards Option */}
              <button
                type="button"
                onClick={() => setSelectedMethod("CARD")}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition ${
                  selectedMethod === "CARD"
                    ? "border-slate-300 bg-[#F1F5F9] shadow-2xs ring-1 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-slate-700 shrink-0" />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Cards</span>
                  </div>
                </div>
              </button>

              {/* UPI Option (Selected by Default) */}
              <button
                type="button"
                onClick={() => setSelectedMethod("UPI")}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition ${
                  selectedMethod === "UPI"
                    ? "border-slate-300 bg-[#F1F5F9] shadow-2xs ring-1 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-8 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-[9px] font-black text-slate-700">
                    UPI
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">UPI</span>
                    <span className="text-[11px] text-slate-500 block">Pay by any UPI app</span>
                  </div>
                </div>
              </button>

              {/* Cash on Delivery Option */}
              <button
                type="button"
                onClick={() => setSelectedMethod("COD")}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition ${
                  selectedMethod === "COD"
                    ? "border-slate-300 bg-[#F1F5F9] shadow-2xs ring-1 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="h-5 w-5 text-slate-700 shrink-0" />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Cash on Delivery</span>
                  </div>
                </div>
              </button>

              {/* Gift Card Option */}
              <button
                type="button"
                onClick={() => setSelectedMethod("GIFTCARD")}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition ${
                  selectedMethod === "GIFTCARD"
                    ? "border-slate-300 bg-[#F1F5F9] shadow-2xs ring-1 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-slate-700 shrink-0" />
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">Have a NovaCart Gift Card?</span>
                  </div>
                </div>
              </button>

              {/* EMI Option (Unavailable matching screenshot) */}
              <div className="w-full p-4 rounded-xl border border-slate-200 bg-white opacity-70 flex items-center justify-between cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
                  <span className="font-bold text-sm text-slate-500">EMI</span>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  Unavailable <Info className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            {/* ── COLUMN 2: CENTER ACTION / "SCAN QR AND PAY" (lg:col-span-5) ── */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              {selectedMethod === "UPI" ? (
                <div className="w-full max-w-sm space-y-4 animate-fade-in">
                  <h2 className="text-center font-bold text-base text-slate-900">
                    Scan QR and Pay
                  </h2>

                  {/* Outer light blue / lavender container */}
                  <div className="bg-[#F2F6FC] rounded-2xl p-5 border border-slate-100 flex flex-col items-center text-center shadow-2xs">
                    {/* Inner White Card */}
                    <div className="w-full bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        AMOUNT
                      </span>
                      <span className="text-2xl font-black text-slate-900 mt-0.5 mb-3.5">
                        ₹{totalAmount.toLocaleString("en-IN")}
                      </span>

                      {/* Dynamic QR Code */}
                      <div className="p-2 bg-white rounded-xl shadow-2xs border border-slate-100">
                        <PaymentQrCode value={upiIntentString} size={150} />
                      </div>

                      {/* 4 Official Circular UPI App Badges */}
                      <div className="flex items-center justify-center gap-2.5 mt-4">
                        <GooglePayCircle className="h-6 w-6" />
                        <PhonePeCircle className="h-6 w-6" />
                        <PaytmCircle className="h-6 w-6" />
                        <BhimUpiCircle className="h-6 w-6" />
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2 font-medium">
                        or any other UPI app
                      </p>
                    </div>

                    {/* QR Code validity timer */}
                    <div className="mt-4 text-center w-full">
                      <p className="text-xs text-slate-600 font-medium">
                        QR valid for <strong className="font-bold text-slate-900">{minutesStr}:{secondsStr}</strong> minutes
                      </p>
                      {/* Animated blue progress bar */}
                      <div className="h-1 bg-slate-200 rounded-full overflow-hidden w-32 mx-auto mt-1.5">
                        <div
                          className="h-full bg-blue-600 transition-all duration-1000 ease-linear rounded-full"
                          style={{ width: `${timerProgress}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-4 leading-relaxed max-w-xs">
                      Do not hit back or close this screen until the transaction is complete
                    </p>

                    <div className="mt-3 text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-1.5 text-center font-medium max-w-xs">
                      ⚡ <strong>Demo / Test Mode:</strong> Powered by Razorpay Sandbox. Use any test UPI ID or test card. No real money will ever be charged.
                    </div>
                  </div>

                  {/* Direct Pay with Razorpay trigger */}
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={placing}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    {placing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Opening Razorpay…</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Pay ₹{totalAmount.toLocaleString("en-IN")} with Razorpay</span>
                      </>
                    )}
                  </button>
                </div>
              ) : selectedMethod === "CARD" ? (
                <div className="w-full max-w-sm bg-[#F2F6FC] rounded-2xl p-5 border border-slate-100 space-y-4 animate-fade-in text-left">
                  <h2 className="font-bold text-base text-slate-900 text-center">Credit or Debit Card</h2>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <VisaLogo className="h-4 w-8" />
                      <MastercardLogo className="h-4 w-7" />
                      <RuPayLogo className="h-4 w-8" />
                    </div>
                    <p className="text-slate-600">
                      Pay securely with any Visa, Mastercard, RuPay, or Maestro card with 3D Secure OTP verification.
                    </p>
                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={placing}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Proceed to Enter Card Details</span>
                    </button>
                  </div>
                </div>
              ) : selectedMethod === "COD" ? (
                <div className="w-full max-w-sm bg-[#F2F6FC] rounded-2xl p-5 border border-slate-100 space-y-4 animate-fade-in text-center">
                  <h2 className="font-bold text-base text-slate-900">Cash on Delivery</h2>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 text-xs shadow-2xs">
                    <Banknote className="h-8 w-8 text-emerald-600 mx-auto" />
                    <p className="text-slate-700 font-semibold">
                      Pay using Cash or UPI QR to the courier delivery partner upon doorstep arrival.
                    </p>
                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={placing}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Confirm Order with Cash on Delivery</span>
                    </button>
                  </div>
                </div>
              ) : selectedMethod === "GIFTCARD" ? (
                <div className="w-full max-w-sm bg-[#F2F6FC] rounded-2xl p-5 border border-slate-100 space-y-4 animate-fade-in text-left">
                  <h2 className="font-bold text-base text-slate-900 text-center">NovaCart Gift Card</h2>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs shadow-2xs">
                    <input
                      placeholder="Enter 16-digit Gift Card Number"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      placeholder="6-digit PIN"
                      type="password"
                      value={giftCardPin}
                      onChange={(e) => setGiftCardPin(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => toast.error("Gift card balance not found or voucher expired.")}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition"
                    >
                      Apply Gift Card
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── COLUMN 3: PRICE DETAILS SIDEBAR (lg:col-span-3) ── */}
            <div className="lg:col-span-3 space-y-3">
              {/* Coupon / Promo Code Card */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span>Coupons & Offers</span>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                    <div>
                      <span className="font-mono font-bold text-emerald-800 tracking-wider">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-emerald-700 block text-[11px]">
                        Saved ₹{appliedCoupon.discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold uppercase tracking-wider"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="ENTER COUPON"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 uppercase font-mono text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 bg-slate-50 focus:bg-white tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shrink-0"
                    >
                      {validatingCoupon ? "…" : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              {/* Price Details Card */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>MRP (incl. of all taxes)</span>
                  <span className="font-bold text-slate-900">₹{estimatedMrp.toLocaleString("en-IN")}</span>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setShowDiscounts(!showDiscounts)}
                    className="flex justify-between items-center w-full text-slate-700 hover:text-slate-900 transition"
                  >
                    <span className="flex items-center gap-1 font-semibold">
                      Discounts
                      {showDiscounts ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </button>

                  {showDiscounts && (
                    <div className="space-y-1 pl-2 text-[11px] pt-0.5">
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>MRP Discount</span>
                        <span className="font-bold">-₹{discountAmount.toLocaleString("en-IN")}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between items-center text-emerald-600 font-semibold">
                          <span>Coupon ({appliedCoupon.code})</span>
                          <span>-₹{appliedCoupon.discountAmount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Total Amount</span>
                  <span className="font-black text-lg text-blue-600">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Green Promo Offer Box (Exact as screenshot) */}
              <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                <div>
                  <p className="text-xs font-bold text-emerald-800">5% instant discount</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Claim now with payment offers</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[8px] font-black">
                    P
                  </div>
                  <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-[8px] font-black">
                    ⚡
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-1 py-0.2 rounded-full">
                    +3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
