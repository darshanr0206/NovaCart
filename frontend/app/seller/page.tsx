"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMySellerProfile, getMyProducts, SellerProfile } from "@/services/seller-service";
import { useAuthStore } from "@/store/auth-store";
import { Product } from "@/types";
import { formatINR } from "@/lib/utils";
import { StatusBadge } from "@/components/product/status-badge";

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, hydrate, hydrated } = useAuthStore();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [notASeller, setNotASeller] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push("/login"); return; }
    getMySellerProfile()
      .then((p) => {
        setProfile(p);
        if (p.status === "APPROVED") {
          getMyProducts().then((res) => setProducts(res.content));
        }
      })
      .catch(() => setNotASeller(true))
      .finally(() => setLoading(false));
  }, [hydrated, user, router]);

  if (loading) return <div className="container-content py-24 text-center text-graphite">Loading dashboard…</div>;

  if (notASeller) {
    return (
      <div className="container-content flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">You&rsquo;re not a seller yet</h1>
        <p className="text-graphite">Register your business to start selling on NovaCart.</p>
        <Link href="/seller/register" className="btn-primary">Become a Seller</Link>
      </div>
    );
  }

  if (profile && profile.status !== "APPROVED") {
    return (
      <div className="container-content flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Seller account status</h1>
        <StatusBadge status={profile.status} />
        <p className="max-w-md text-graphite">
          {profile.status === "PENDING" && "Your application is under review. We'll email you once it's approved."}
          {profile.status === "REJECTED" && "Your application was not approved this time."}
          {profile.status === "SUSPENDED" && "Your seller account is currently suspended. Contact support for details."}
        </p>
      </div>
    );
  }

  const lowStock = products.filter((p) => p.stockQuantity <= 5);

  return (
    <div className="container-content py-6 sm:py-12">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{profile?.businessName}</h1>
          <p className="text-sm text-graphite">Seller Dashboard</p>
        </div>
        <Link href="/seller/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Low Stock" value={lowStock.length} />
        <StatCard label="Out of Stock" value={products.filter((p) => !p.inStock).length} />
        <StatCard label="Avg. Rating" value={(products.reduce((s, p) => s + p.averageRating, 0) / (products.length || 1)).toFixed(1)} />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Your Products</h2>
          <Link href="/seller/products" className="text-sm font-medium text-nova-600 hover:text-nova-700">Manage all →</Link>
        </div>
        <div className="card divide-y divide-line">
          {products.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-ink">{p.name}</p>
                <p className="text-xs text-graphite">Stock: {p.stockQuantity}</p>
              </div>
              <span className="text-sm font-semibold text-ink">{formatINR(p.effectivePrice)}</span>
            </div>
          ))}
          {products.length === 0 && <p className="p-6 text-center text-sm text-graphite">No products listed yet.</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-graphite">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
