import { api } from "@/lib/api";
import { Cart } from "@/types";

export async function getCart(): Promise<Cart> {
  const { data } = await api.get("/cart");
  return data;
}

export async function addToCart(productId: number, quantity = 1): Promise<Cart> {
  const { data } = await api.post("/cart/items", { productId, quantity });
  return data;
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
  return data;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const { data } = await api.delete(`/cart/items/${itemId}`);
  return data;
}
