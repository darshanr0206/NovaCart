"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSellers, approveSeller, rejectSeller, SellerAdmin } from "@/services/admin-service";
import { useAuthStore } from "@/store/auth-store";
import { StatusBadge } from "@/components/product/status-badge";
import { toast } from "sonner";

const TABS = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;

export default function AdminSellersPage() {
  const router = useRouter();
  const { user, hasRole, hydrate, hydrated } = useAuthStore();
  const [tab, setTab] = useState<typeof TABS[number]>("PENDING");
  const [sellers, setSellers] = useState<SellerAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!hydrated) return;
    if (!user || !hasRole("ADMIN")) { router.push("/login"); return; }
    load();
  }, [hydrated, user, hasRole, router, tab]);

  function load() {
    setLoading(true);
    getSellers(tab, 0, 50).then((res) => setSellers(res.content)).finally(() => setLoading(false));
  }

  async function handleApprove(id: number) {
    await approveSeller(id);
    toast.success("Seller approved");
    load();
  }

  async function handleReject(id: number) {
    await rejectSeller(id);
    toast.success("Seller rejected");
    load();
  }

  return (
    <div className="container-content py-12">
      <h1 className="mb-6 text-2xl font-bold text-ink">Manage Sellers</h1>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? "bg-ink text-white" : "border border-line text-graphite hover:text-ink"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-graphite">Loading…</p>
      ) : (
        <div className="card divide-y divide-line">
          {sellers.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-ink">{s.businessName}</p>
                <p className="text-xs text-graphite">{s.businessEmail}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={s.status} />
                {s.status === "PENDING" && (
                  <>
                    <button onClick={() => handleApprove(s.id)} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                      Approve
                    </button>
                    <button onClick={() => handleReject(s.id)} className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-graphite hover:text-red-600">
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {sellers.length === 0 && <p className="p-8 text-center text-sm text-graphite">No {tab.toLowerCase()} sellers.</p>}
        </div>
      )}
    </div>
  );
}
