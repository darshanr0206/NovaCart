import { api } from "@/lib/api";

export interface Address {
  id: number;
  label?: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export async function getAddresses(): Promise<Address[]> {
  const { data } = await api.get("/addresses");
  return data;
}

export async function createAddress(payload: Omit<Address, "id">): Promise<Address> {
  const { data } = await api.post("/addresses", payload);
  return data;
}

export async function setDefaultAddress(id: number): Promise<Address> {
  const { data } = await api.put(`/addresses/${id}/default`);
  return data;
}

export async function deleteAddress(id: number): Promise<void> {
  await api.delete(`/addresses/${id}`);
}

