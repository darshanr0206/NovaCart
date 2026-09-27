import { api } from "@/lib/api";

export interface WishlistItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    images: { url: string }[];
  };
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const { data } = await api.get("/wishlist");
  return data;
}

export async function addToWishlist(productId: number) {
  const { data } = await api.post("/wishlist", { productId });
  return data;
}

export async function removeFromWishlist(productId: number) {
  await api.delete(`/wishlist/${productId}`);
}
