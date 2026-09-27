"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAdminDashboard } from "@/services/admin-service";
import { useAuthStore } from "@/store/auth-store";

const LABELS: Record<string, string> = {
  totalCustomers: "Total Users",
  totalProducts: "Total Products",
  totalOrders: "Total Orders",
  pendingSellerApprovals: "Pending Sellers",
  pendingReturns: "Pending Returns",
  activeDeliveries: "Active Deliveries",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, hasRole, hydrate, hydrated } = useAuthStore();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!hydrated) return;
    if (!user || !hasRole("ADMIN")) { router.push("/login"); return; }
    getAdminDashboard().then(setStats).finally(() => setLoading(false));
  }, [hydrated, user, hasRole, router]);

  if (loading) return <div className="container-content py-24 text-center text-graphite">Loading dashboard…</div>;

  return (
    <div className="container-content py-12">
      <h1 className="mb-8 text-2xl font-bold text-ink">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Object.entries(LABELS).map(([key, label]) => (
          <div key={key} className="card p-6">
            <p className="text-xs text-graphite">{label}</p>
            <p className="mt-2 text-3xl font-bold text-ink">{stats[key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/admin/sellers" className="btn-secondary">Manage Sellers</Link>
        <Link href="/admin/orders" className="btn-secondary">Manage Orders</Link>
      </div>
    </div>
  );
}
