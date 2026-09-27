import { FileText, CheckCircle, AlertCircle, Scale, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Terms of Service — NovaCart",
  description: "Terms and conditions governing the use of NovaCart multi-vendor e-commerce platform and marketplace services.",
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-content max-w-4xl space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-line p-8 md:p-12 shadow-sm text-center">
          <span className="px-3 py-1 bg-nova-100 text-nova-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Terms & Agreement
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mt-3">
            Terms of Service
          </h1>
          <p className="text-xs text-graphite mt-2">
            Please read these terms carefully before browsing or placing orders on NovaCart.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-line p-8 md:p-10 shadow-sm space-y-8 text-xs md:text-sm text-graphite leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <FileText className="h-5 w-5 text-nova-600" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, registering, or making purchases on NovaCart (&quot;the Platform&quot;), you agree to comply with and be legally bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-600" />
              2. Marketplace Architecture & Seller Roles
            </h2>
            <p>
              NovaCart operates as an online marketplace connecting independent registered third-party merchants (&quot;Sellers&quot;) with retail consumers (&quot;Buyers&quot;). While NovaCart facilitates order management, payments, and 7-stage fulfillment tracking, individual sellers are responsible for the legal compliance, product warranty, and inventory accuracy of their listings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              3. Orders, Pricing & Payment Terms
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All product prices displayed include applicable GST taxes in Indian Rupees (INR).</li>
              <li>Orders placed via Razorpay require successful payment confirmation or valid transaction screenshot verification before shipment.</li>
              <li>NovaCart reserves the right to cancel any order in the event of pricing errors, stock unavailability, or suspected fraudulent activity.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              4. Returns & Cancellations
            </h2>
            <p>
              Buyers may request order cancellations prior to dispatch. Once delivered, items can be returned within 7 calendar days subject to our Return Policy criteria. Unauthorized damage or misuse invalidates return eligibility.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base md:text-lg font-bold text-ink flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-slate-700" />
              5. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal disputes arising out of the use of the platform shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
