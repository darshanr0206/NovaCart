import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function starRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
