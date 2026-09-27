import Link from "next/link";
import { RotateCcw, Truck, CheckCircle2, ShieldAlert, ArrowRight, Clock, Banknote } from "lucide-react";

export const metadata = {
  title: "Returns & Refund Policy — NovaCart",
  description: "Learn about NovaCart's 7-day hassle-free return and refund policy, eligibility criteria, and step-by-step return process.",
};

export default function ReturnsPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-content max-w-4xl space-y-10">
        {/* Header Hero */}
        <div className="bg-white rounded-2xl border border-line p-8 md:p-12 shadow-sm text-center relative overflow-hidden">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Customer Guarantee
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mt-3">
            7-Day Hassle-Free Returns
          </h1>
          <p className="text-sm md:text-base text-graphite max-w-xl mx-auto mt-2">
            Shop with total peace of mind. If you are not completely satisfied with your order, return it within 7 days for a quick replacement or full refund.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div>
          <h2 className="text-xl font-bold text-ink text-center mb-6">How NovaCart Returns Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 space-y-2.5 relative">
              <div className="h-8 w-8 rounded-lg bg-nova-50 text-nova-600 font-extrabold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-bold text-sm text-ink">Request Return</h3>
              <p className="text-xs text-graphite leading-relaxed">
                Go to &apos;My Orders&apos;, select your delivered item, and choose &apos;Request Return&apos; with your reason.
              </p>
            </div>

            <div className="card p-5 space-y-2.5 relative">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-bold text-sm text-ink">Doorstep Pickup</h3>
              <p className="text-xs text-graphite leading-relaxed">
                Our logistics partner will collect the item directly from your delivery address within 48 hours.
              </p>
            </div>

            <div className="card p-5 space-y-2.5 relative">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 font-extrabold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-bold text-sm text-ink">Quality Check</h3>
              <p className="text-xs text-graphite leading-relaxed">
                The returned item is inspected at our hub to confirm tags and original packaging are intact.
              </p>
            </div>

            <div className="card p-5 space-y-2.5 relative">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 font-extrabold flex items-center justify-center text-sm">
                4
              </div>
              <h3 className="font-bold text-sm text-ink">Instant Refund</h3>
              <p className="text-xs text-graphite leading-relaxed">
                Refund is processed immediately to your original payment method or bank account.
              </p>
            </div>
          </div>
        </div>

        {/* Eligibility & Guidelines */}
        <div className="bg-white rounded-2xl border border-line p-8 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Return Eligibility Guidelines
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-graphite leading-relaxed">
            <div className="space-y-3">
              <h4 className="font-bold text-ink text-sm">Eligible for Return:</h4>
              <ul className="space-y-2 list-disc pl-4">
                <li>Products with manufacturing defects or physical damage during transit.</li>
                <li>Incorrect item, color, or size delivered compared to order invoice.</li>
                <li>Item is unused, unwashed, and undamaged with all original price tags attached.</li>
                <li>Original brand packaging, accessories, warranty cards, and user manuals included.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-ink text-sm">Non-Returnable Items:</h4>
              <ul className="space-y-2 list-disc pl-4 text-slate-500">
                <li>Innerwear, lingerie, swimwear, and personal hygiene products.</li>
                <li>Perishable grocery items, fresh dairy, and open food products.</li>
                <li>Items marked as &apos;Final Sale&apos; or &apos;Clearance&apos; on the product page.</li>
                <li>Software products, digital gift cards, or downloadable goods.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Refund Timelines */}
        <div className="bg-white rounded-2xl border border-line p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <Banknote className="h-5 w-5 text-nova-600" />
            Refund Timelines by Payment Method
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-line rounded-lg">
              <thead className="bg-slate-50 text-ink font-semibold">
                <tr>
                  <th className="p-3 border-b border-line">Payment Method</th>
                  <th className="p-3 border-b border-line">Refund Destination</th>
                  <th className="p-3 border-b border-line">Estimated Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-graphite">
                <tr>
                  <td className="p-3 font-medium text-ink">UPI / QR (Razorpay)</td>
                  <td className="p-3">Original Bank Account / VPA</td>
                  <td className="p-3 text-emerald-600 font-semibold">Instant – 24 hours</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-ink">Credit / Debit Card</td>
                  <td className="p-3">Issuing Bank Account</td>
                  <td className="p-3">3 – 5 business days</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-ink">Net Banking</td>
                  <td className="p-3">Bank Account</td>
                  <td className="p-3">2 – 4 business days</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-ink">Cash on Delivery (COD)</td>
                  <td className="p-3">Bank Transfer (NEFT / IMPS)</td>
                  <td className="p-3">2 – 3 business days after bank details provided</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action CTA */}
        <div className="bg-gradient-to-r from-nova-600 to-indigo-700 text-white rounded-2xl p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold">Need to initiate a return?</h3>
            <p className="text-xs text-white/90 mt-1">Visit your order history to view eligible items and start a return request.</p>
          </div>
          <Link href="/orders" className="bg-white text-nova-700 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-2 whitespace-nowrap shadow-sm">
            <span>Go to My Orders</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
