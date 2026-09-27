"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/services/seller-service";
import { getCategories } from "@/services/category-service";
import { Category } from "@/types";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "", description: "", specifications: "", price: "", discountPercent: "",
    categoryId: "", stockQuantity: "", lowStockThreshold: "5",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const product = await createProduct({
        name: form.name,
        description: form.description,
        specifications: form.specifications,
        price: Number(form.price),
        discountPercent: form.discountPercent ? Number(form.discountPercent) : 0,
        categoryId: Number(form.categoryId),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
      });
      toast.success("Product created. Add photos from the product page via the upload API.");
      router.push(`/products/${product.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create product"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-content py-12">
      <h1 className="mb-6 text-2xl font-bold text-ink">Add a New Product</h1>
      <form onSubmit={handleSubmit} className="card grid max-w-2xl gap-4 p-6">
        <div>
          <label className="text-xs font-medium text-graphite">Product name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-graphite">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-graphite">Specifications</label>
          <textarea value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-graphite">Price (₹)</label>
            <input required type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-graphite">Discount %</label>
            <input type="number" step="0.01" min="0" max="100" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-graphite">Category</label>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500">
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-graphite">Stock quantity</label>
            <input required type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? "Creating…" : "Create Product"}
        </button>
      </form>
    </div>
  );
}
