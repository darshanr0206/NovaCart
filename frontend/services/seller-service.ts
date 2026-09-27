import { api } from "@/lib/api";
import { PageResponse, Product } from "@/types";

export async function registerSeller(payload: { businessName: string; businessEmail: string; businessPhone?: string; businessAddress?: string; businessInfo?: string }) {
  const { data } = await api.post("/sellers/register", payload);
  return data;
}

export interface SellerProfile {
  id: number;
  businessName: string;
  businessEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  createdAt: string;
}

export async function getMySellerProfile(): Promise<SellerProfile> {
  const { data } = await api.get("/seller/me");
  return data;
}

export async function getMyProducts(page = 0, size = 20): Promise<PageResponse<Product>> {
  const { data } = await api.get("/seller/products", { params: { page, size } });
  return data;
}

export async function createProduct(payload: {
  name: string; description?: string; specifications?: string; price: number;
  discountPercent?: number; categoryId: number; stockQuantity: number; lowStockThreshold?: number;
}) {
  const { data } = await api.post("/products", payload);
  return data;
}
