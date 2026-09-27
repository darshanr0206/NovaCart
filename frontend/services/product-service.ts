import { api } from "@/lib/api";
import { PageResponse, Product } from "@/types";

export interface ProductSearchParams {
  keyword?: string;
  categoryId?: number;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: number;
  minRating?: number;
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest" | "popularity" | "discount";
  brand?: string;
  color?: string;
  size?: string;
  minDiscount?: number;
  page?: number;
  sizePage?: number;
}

export async function searchProducts(params: ProductSearchParams): Promise<PageResponse<Product>> {
  const { data } = await api.get("/products", { params });
  return data;
}

export async function getProduct(id: number | string): Promise<Product> {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function getSimilarProducts(productId: number | string, limit = 8): Promise<Product[]> {
  try {
    const { data } = await api.get(`/recommendations/similar/${productId}`, { params: { limit } });
    return data;
  } catch (err) {
    console.error("Failed to fetch similar products:", err);
    return [];
  }
}

export async function getRecommendedForYou(limit = 12): Promise<Product[]> {
  try {
    const { data } = await api.get("/recommendations/for-you", { params: { limit } });
    return data;
  } catch (err) {
    console.error("Failed to fetch recommendations for you:", err);
    return [];
  }
}

export async function getCompleteTheLook(productId: number | string): Promise<Product[]> {
  try {
    const { data } = await api.get(`/recommendations/complete-look/${productId}`);
    return data;
  } catch (err) {
    console.error("Failed to fetch complete the look:", err);
    return [];
  }
}

export async function getFrequentlyBoughtTogether(productId: number | string): Promise<Product[]> {
  try {
    const { data } = await api.get(`/recommendations/frequently-bought-together/${productId}`);
    return data;
  } catch (err) {
    console.error("Failed to fetch frequently bought together:", err);
    return [];
  }
}

export async function searchByImage(file?: File, imageUrl?: string): Promise<Product[]> {
  try {
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (imageUrl) formData.append("imageUrl", imageUrl);

    const { data } = await api.post("/products/search-by-image", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  } catch (err) {
    console.error("Failed to search by image:", err);
    return [];
  }
}

export async function getSearchSuggestions(query: string, limit = 8): Promise<import("@/types").SearchSuggestion[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const { data } = await api.get("/products/suggestions", {
      params: { query: query.trim(), limit },
    });
    return data ?? [];
  } catch (err) {
    console.error("Failed to fetch search suggestions:", err);
    return [];
  }
}

export async function getCategoryBrands(categorySlug?: string, categoryId?: number): Promise<string[]> {
  try {
    const { data } = await api.get("/products/brands", {
      params: {
        categorySlug: categorySlug ? categorySlug.trim() : undefined,
        categoryId: categoryId ? categoryId : undefined
      }
    });
    return data ?? [];
  } catch (err) {
    console.error("Failed to fetch category brands:", err);
    return [];
  }
}


