export interface Category {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string;
  parent?: { id: number; name: string; slug: string } | null;
  children?: Category[];
}

export interface SearchSuggestion {
  type: "CATEGORY" | "PRODUCT";
  id?: number;
  title: string;
  categoryName?: string;
  categorySlug?: string;
  brand?: string;
  imageUrl?: string;
  price?: number;
  effectivePrice?: number;
  discountPercent?: number;
  targetUrl: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  specifications?: string;
  price: number;
  discountPercent: number;
  effectivePrice: number;
  averageRating: number;
  reviewCount: number;
  categoryName: string;
  categoryId?: number;
  categorySlug?: string;
  sellerName: string;
  sellerId: number;
  stockQuantity: number;
  inStock: boolean;
  images: string[];
  createdAt: string;
  brand?: string;
  color?: string;
  size?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CartItem {
  itemId: number;
  productId: number;
  productName: string;
  image?: string;
  price: number;
  quantity: number;
  lineTotal: number;
  available: boolean;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}

export type OrderStatus =
  | "PLACED" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED"
  | "RETURN_REQUESTED" | "RETURN_APPROVED" | "RETURN_REJECTED" | "RETURNED" | "REFUNDED";

export interface OrderItem {
  id: number;
  productName: string;
  price: number;
  quantity: number;
  itemStatus: OrderStatus;
}

export interface PaymentInfo {
  id?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
  paymentMethod?: string;
  screenshotUrl?: string;
  amount?: number;
  status?: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt?: string;
}

export interface ReturnRequestInfo {
  id: number;
  orderId: number;
  orderNumber?: string;
  orderItemId?: number | null;
  customer?: string;
  customerEmail?: string;
  product?: string;
  amount?: number;
  reason: string;
  note?: string;
  adminComment?: string;
  status: OrderStatus;
  refundStatus?: "NONE" | "INITIATED" | "PROCESSING" | "COMPLETED" | "FAILED" | string;
  refundAmount?: number;
  refundTransactionId?: string;
  refundPaymentMethod?: string;
  refundedAt?: string;
  razorpayRefundId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  status: OrderStatus;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  payment?: PaymentInfo | null;
  paymentStatus?: string;
  paymentScreenshotUrl?: string;
  paymentMethod?: string;
  returnRequest?: ReturnRequestInfo | null;
}

export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  roles: string[];
  active: boolean;
  createdAt: string;
}

export type { Address } from "@/services/address-service";
