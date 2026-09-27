import { api } from "@/lib/api";
import { Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get("/categories");
  return data;
}
