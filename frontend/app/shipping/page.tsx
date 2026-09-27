import { Truck, Clock, MapPin, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Shipping & Delivery Policy — NovaCart",
  description: "Information regarding shipping speeds, delivery charges, express dispatch, and coverage across 19,000+ pin codes in India.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-content max-w-4xl space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-line p-8 md:p-12 shadow-sm text-center">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Fast & Reliable
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mt-3">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs text-graphite mt-2">
            Doorstep delivery across 19,000+ pin codes nationwide with real-time 7-stage order tracking.
          </p>
        </div>

        {/* Shipping Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 text-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-nova-50 text-nova-600 flex items-center justify-center mx-auto">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-ink">Free Delivery on ₹499+</h3>
            <p className="text-xs text-graphite">Enjoy free standard shipping on all qualifying orders above ₹499.</p>
          </div>

          <div className="card p-5 text-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-ink">2 – 5 Days Delivery</h3>
            <p className="text-xs text-graphite">Metro deliveries in 24–48 hours; regional transit within 3–5 business days.</p>
          </div>

          <div className="card p-5 text-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-ink">Safe Tamper-Proof Packaging</h3>
            <p className="text-xs text-graphite">Reinforced packaging and insured transit for sensitive electronics and mobiles.</p>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-2xl border border-line p-8 md:p-10 shadow-sm space-y-8 text-xs md:text-sm text-graphite leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink">1. Delivery Zones & Estimated Timelines</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-line rounded-lg">
                <thead className="bg-slate-50 text-ink font-semibold">
                  <tr>
                    <th className="p-3 border-b border-line">Destination Zone</th>
                    <th className="p-3 border-b border-line">Coverage Examples</th>
                    <th className="p-3 border-b border-line">Estimated Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="p-3 font-medium text-ink">Tier 1 Metros</td>
                    <td className="p-3">Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Kolkata</td>
                    <td className="p-3 text-emerald-600 font-semibold">1 – 2 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-ink">Tier 2 Cities</td>
                    <td className="p-3">Pune, Ahmedabad, Jaipur, Chandigarh, Lucknow, Kochi</td>
                    <td className="p-3 font-medium">2 – 3 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-ink">Rest of India & Rural</td>
                    <td className="p-3">All other serviceable postal pin codes</td>
                    <td className="p-3 font-medium">4 – 6 Business Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink">2. Live Order Tracking Stages</h2>
            <p>
              Once your order is confirmed, you can track it through every milestone on your &apos;My Orders&apos; tracking dashboard:
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-700 py-1">
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">1. Placed</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md">2. Confirmed</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-md">3. Processing</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-md">4. Packed</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md">5. Shipped</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-md">6. Out for Delivery</span>
              <span>→</span>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md">7. Delivered</span>
            </div>
          </section>
        </div>

        {/* CTA Banner */}
        <div className="bg-white rounded-xl border border-line p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-ink text-sm">Have an active shipment?</h4>
            <p className="text-xs text-graphite mt-0.5">Check current delivery progress and driver contact info.</p>
          </div>
          <Link href="/orders" className="btn-primary text-xs flex items-center gap-1.5 py-2 px-4">
            <span>Track My Order</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
