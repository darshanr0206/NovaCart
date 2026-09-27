"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyProducts } from "@/services/seller-service";
import { useAuthStore } from "@/store/auth-store";
import { Product } from "@/types";
import { formatINR } from "@/lib/utils";

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, hydrate, hydrated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push("/login"); return; }
    getMyProducts(0, 100).then((res) => setProducts(res.content)).finally(() => setLoading(false));
  }, [hydrated, user, router]);

  return (
    <div className="container-content py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Your Products</h1>
        <Link href="/seller/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      {loading ? (
        <p className="text-graphite">Loading…</p>
      ) : (
        <div className="card divide-y divide-line">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-ink">{p.name}</p>
                <p className="text-xs text-graphite">
                  Stock: {p.stockQuantity} {p.stockQuantity <= 5 && <span className="text-amber-600">(Low stock)</span>}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-ink">{formatINR(p.effectivePrice)}</span>
                <Link href={`/products/${p.id}`} className="text-xs text-nova-600 hover:text-nova-700">View</Link>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="p-8 text-center text-sm text-graphite">No products yet — add your first one.</p>}
        </div>
      )}
    </div>
  );
}
