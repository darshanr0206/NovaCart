import { ShieldCheck, Lock, Eye, Server, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — NovaCart",
  description: "Learn how NovaCart collects, uses, protects, and handles your personal data, payment information, and browsing privacy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-content max-w-4xl space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-line p-8 md:p-12 shadow-sm text-center">
          <span className="px-3 py-1 bg-nova-100 text-nova-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Legal & Security
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mt-3">
            NovaCart Privacy Policy
          </h1>
          <p className="text-xs text-graphite mt-2">
            Last Updated: September 2026 • Effective Date: January 1, 2026
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-line p-8 md:p-10 shadow-sm space-y-8 text-xs md:text-sm text-graphite leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-nova-600" />
              1. Overview & Commitment
            </h2>
            <p>
              NovaCart Technologies Pvt. Ltd. (&quot;NovaCart&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to protecting the personal data of customers, merchants, and website visitors. This policy explains how we collect, store, process, and safeguard your personal information when using our platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Personal Identifiers:</strong> Name, email address, phone number, shipping and billing addresses.</li>
              <li><strong>Account Credentials:</strong> Secure hashed passwords, role assignments, and session tokens.</li>
              <li><strong>Payment & Transaction Data:</strong> Razorpay transaction IDs, payment screenshot proofs, order history, and billing invoices. (We do NOT store raw credit/debit card CVV numbers).</li>
              <li><strong>Usage & Device Information:</strong> IP address, browser type, operating system, and interaction analytics.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-600" />
              3. How We Use Your Information
            </h2>
            <p>We use the data collected for the following operational purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Processing product purchases, fulfilling orders, and coordinating 7-stage doorstep delivery.</li>
              <li>Verifying Razorpay payments and handling refund transactions.</li>
              <li>Providing 24/7 customer support and communicating important order status notifications.</li>
              <li>Detecting and preventing fraudulent transactions or abuse on our marketplace.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              4. Data Protection & Security
            </h2>
            <p>
              We employ industry-standard 256-bit SSL encryption for data in transit and secure database storage with strict role-based access control. Payments are processed securely in compliance with PCI-DSS standards via Razorpay.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              5. Your Rights & Data Choices
            </h2>
            <p>
              You have the right to access, update, or request deletion of your personal account data at any time through your profile settings or by contacting our Data Privacy Officer at <span className="font-semibold text-ink">privacy@novacart.app</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
