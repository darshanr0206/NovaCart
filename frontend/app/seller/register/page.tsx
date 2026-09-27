"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerSeller } from "@/services/seller-service";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { user, hydrate, hydrated } = useAuthStore();
  const [form, setForm] = useState({ businessName: "", businessEmail: "", businessPhone: "", businessAddress: "", businessInfo: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (hydrated && !user) router.push("/login");
  }, [hydrated, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await registerSeller(form);
      toast.success("Application submitted — an admin will review your seller account shortly.");
      router.push("/seller");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not submit seller application"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-content flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-ink">Become a NovaCart Seller</h1>
        <p className="mt-1 text-sm text-graphite">Tell us about your business. An admin will review and approve your account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-graphite">Business name</label>
            <input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-graphite">Business email</label>
            <input type="email" required value={form.businessEmail} onChange={(e) => setForm({ ...form, businessEmail: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-graphite">Business phone</label>
            <input value={form.businessPhone} onChange={(e) => setForm({ ...form, businessPhone: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-graphite">Business address</label>
            <textarea value={form.businessAddress} onChange={(e) => setForm({ ...form, businessAddress: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" rows={2} />
          </div>
          <div>
            <label className="text-xs font-medium text-graphite">Tell us about what you sell</label>
            <textarea value={form.businessInfo} onChange={(e) => setForm({ ...form, businessInfo: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500" rows={3} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
