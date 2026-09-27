import { cn } from "@/lib/utils";
import { OrderStatus } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  PLACED: "bg-mist text-graphite",
  CONFIRMED: "bg-nova-50 text-nova-700",
  PROCESSING: "bg-nova-50 text-nova-700",
  PACKED: "bg-nova-50 text-nova-700",
  SHIPPED: "bg-blue-50 text-blue-700",
  OUT_FOR_DELIVERY: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-600",
  RETURN_REQUESTED: "bg-amber-50 text-amber-700",
  RETURN_APPROVED: "bg-amber-50 text-amber-700",
  RETURNED: "bg-amber-50 text-amber-700",
  REFUNDED: "bg-amber-50 text-amber-700",
};

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLES[status] ?? "bg-mist text-graphite")}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
