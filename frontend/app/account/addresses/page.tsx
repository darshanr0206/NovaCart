"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getAddresses, createAddress, deleteAddress, setDefaultAddress, Address } from "@/services/address-service";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Plus, Trash2, CheckCircle, Home, Briefcase, Loader2 } from "lucide-react";

export default function SavedAddressesPage() {
  const router = useRouter();
  const { user, hydrate, hydrated } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    recipientName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    label: "Home",
    isDefault: false,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login?redirect=/account/addresses");
    }
  }, [hydrated, user, router]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      toast.error("Failed to load saved addresses from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.accessToken) {
      loadAddresses();
    }
  }, [user?.accessToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.recipientName.trim() ||
      !form.phone.trim() ||
      !form.line1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.postalCode.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const created = await createAddress({
        ...form,
        isDefault: form.isDefault || addresses.length === 0,
      });
      toast.success("Address saved permanently!");
      setShowAddModal(false);
      setForm({
        recipientName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        label: "Home",
        isDefault: false,
      });
      loadAddresses();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save address"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete address"));
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      localStorage.setItem("novacart_selected_address_id", String(id));
      toast.success("Default address updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to set default address"));
    }
  };

  if (!hydrated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-nova-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFB] min-h-[calc(100vh-64px)] pb-24 sm:pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="p-2 -ml-2 rounded-xl text-slate-800 hover:bg-slate-100 transition"
              aria-label="Back to Account"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                Saved Addresses
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage your delivery addresses for quick checkout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Address</span>
          </button>
        </div>

        {/* Add Address Form */}
        {showAddModal && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#7C3AED]" />
                <span>Add Delivery Address</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-ink outline-none focus:border-[#7C3AED]"
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Phone Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-ink outline-none focus:border-[#7C3AED]"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "") })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Address Line 1 (Flat, House no., Building, Street) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Green Valley Apartments"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-ink outline-none focus:border-[#7C3AED]"
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Address Line 2 (Area, Colony, Landmark)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near City Hospital"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-ink outline-none focus:border-[#7C3AED]"
                  value={form.line2}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-ink outline-none focus:border-[#7C3AED]"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karnataka"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-ink outline-none focus:border-[#7C3AED]"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 560001"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-ink outline-none focus:border-[#7C3AED]"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Address Type / Label
                </label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-ink outline-none focus:border-[#7C3AED] bg-white"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work / Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <label htmlFor="isDefaultCheckbox" className="text-xs text-slate-700 select-none cursor-pointer">
                  Make this my default delivery address
                </label>
              </div>

              <div className="sm:col-span-2 pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2.5 px-5 text-xs font-bold flex-1 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Address</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address Cards List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#7C3AED]" />
            <p>Loading your saved addresses…</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-ink">No Saved Addresses Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your delivery address so it will be saved permanently for all future orders.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Address</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all relative ${
                  addr.isDefault
                    ? "border-[#7C3AED] ring-1 ring-[#7C3AED]/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-ink">{addr.recipientName}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {addr.label || "Home"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}
                      <br />
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p className="text-xs text-slate-500 pt-1 font-medium">
                      Phone: <span className="text-slate-800 font-semibold">{addr.phone}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      aria-label="Delete address"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {!addr.isDefault ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition"
                    >
                      Set as Default Address
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Primary shipping destination
                    </span>
                  )}

                  <Link
                    href="/checkout"
                    onClick={() => {
                      localStorage.setItem("novacart_selected_address_id", String(addr.id));
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-nova-600 ml-auto"
                  >
                    Use for Checkout &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
