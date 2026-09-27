"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyDeliveries, updateDeliveryStatus, DeliveryOrder } from "@/services/delivery-service";
import { useAuthStore } from "@/store/auth-store";
import { StatusBadge } from "@/components/product/status-badge";
import { toast } from "sonner";

const NEXT_STATUS: Record<string, DeliveryOrder["status"] | null> = {
  ASSIGNED: "ACCEPTED",
  ACCEPTED: "PICKED_UP",
  PICKED_UP: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: null,
};

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const { user, hasRole, hydrate, hydrated } = useAuthStore();
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!hydrated) return;
    if (!user || !hasRole("DELIVERY_PARTNER")) { router.push("/login"); return; }
    load();
  }, [hydrated, user, hasRole, router]);

  function load() {
    setLoading(true);
    getMyDeliveries().then((res) => setDeliveries(res.content)).finally(() => setLoading(false));
  }

  async function advance(delivery: DeliveryOrder) {
    const next = NEXT_STATUS[delivery.status];
    if (!next) return;
    await updateDeliveryStatus(delivery.id, next);
    toast.success(`Marked as ${next.replaceAll("_", " ")}`);
    load();
  }

  if (loading) return <div className="container-content py-24 text-center text-graphite">Loading deliveries…</div>;

  return (
    <div className="container-content py-12">
      <h1 className="mb-6 text-2xl font-bold text-ink">Assigned Deliveries</h1>
      <div className="card divide-y divide-line">
        {deliveries.map((d) => {
          const next = NEXT_STATUS[d.status];
          return (
            <div key={d.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-ink">Delivery #{d.id}</p>
                <p className="text-xs text-graphite">{d.deliveryAddress ?? "Address on file"}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={d.status} />
                {next && (
                  <button onClick={() => advance(d)} className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-graphite">
                    Mark {next.replaceAll("_", " ")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {deliveries.length === 0 && <p className="p-8 text-center text-sm text-graphite">No deliveries assigned right now.</p>}
      </div>
    </div>
  );
}
