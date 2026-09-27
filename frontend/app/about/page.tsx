import Link from "next/link";
import { ShieldCheck, Truck, ShoppingBag, Store, Award, Users, HeartHandshake, ArrowRight } from "lucide-react";

export const metadata = {
  title: "About Us — NovaCart Marketplace",
  description: "Learn about NovaCart, our mission to empower independent sellers, and our commitment to seamless e-commerce for customers across India.",
};

export default function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      {/* Hero Section */}
      <div className="container-content max-w-5xl">
        <div className="bg-white rounded-2xl border border-line p-8 md:p-14 shadow-sm text-center relative overflow-hidden mb-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-nova-50/70 -z-0" />
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-50/70 -z-0" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-3 py-1 bg-nova-100 text-nova-800 text-xs font-bold rounded-full uppercase tracking-wider">
              About NovaCart
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-ink tracking-tight">
              Many Sellers. <span className="text-nova-600">One Cart.</span>
            </h1>
            <p className="text-base md:text-lg text-graphite leading-relaxed">
              NovaCart is India’s next-generation e-commerce marketplace connecting millions of customers with trusted independent sellers, offering authentic products across electronics, fashion, groceries, and home essentials.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="card p-6 text-center">
            <h3 className="text-3xl font-extrabold text-nova-600">38,000+</h3>
            <p className="text-xs font-medium text-graphite mt-1">Verified Products</p>
          </div>
          <div className="card p-6 text-center">
            <h3 className="text-3xl font-extrabold text-ink">500+</h3>
            <p className="text-xs font-medium text-graphite mt-1">Trusted Sellers</p>
          </div>
          <div className="card p-6 text-center">
            <h3 className="text-3xl font-extrabold text-emerald-600">99.8%</h3>
            <p className="text-xs font-medium text-graphite mt-1">On-Time Delivery</p>
          </div>
          <div className="card p-6 text-center">
            <h3 className="text-3xl font-extrabold text-indigo-600">24/7</h3>
            <p className="text-xs font-medium text-graphite mt-1">Customer Support</p>
          </div>
        </div>

        {/* Our Mission & Values */}
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-ink">Our Mission</h2>
              <p className="text-sm text-graphite leading-relaxed">
                We believe that shopping online should be effortless, secure, and rewarding. Our multi-vendor architecture enables verified local brands and established retailers to reach customers with fair commissions and automated logistics.
              </p>
              <p className="text-sm text-graphite leading-relaxed">
                Whether you are ordering daily groceries, upgrading your smartphone, or refreshing your wardrobe, NovaCart brings everything together into a unified checkout and instant fulfillment experience.
              </p>
            </div>
            <div className="bg-gradient-to-br from-nova-600 to-indigo-700 text-white rounded-2xl p-8 shadow-md space-y-4">
              <Award className="h-10 w-10 text-nova-200" />
              <h3 className="text-xl font-bold">Uncompromising Quality & Authenticity</h3>
              <p className="text-xs text-white/90 leading-relaxed">
                Every product listed on NovaCart passes rigorous seller vetting and authenticity checks. With integrated Razorpay secure payments and 7-day hassle-free returns, you can shop with 100% confidence.
              </p>
            </div>
          </div>

          {/* Pillars */}
          <div>
            <h2 className="text-2xl font-bold text-ink text-center mb-8">What Sets NovaCart Apart</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-nova-50 flex items-center justify-center text-nova-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-ink text-base">Secure Payments</h4>
                <p className="text-xs text-graphite leading-relaxed">
                  End-to-end encrypted transactions powered by Razorpay with instant payment verification and transparent invoices.
                </p>
              </div>

              <div className="card p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Truck className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-ink text-base">Express Logistics</h4>
                <p className="text-xs text-graphite leading-relaxed">
                  Live 7-stage order tracking from warehouse packaging to your doorstep with doorstep delivery updates.
                </p>
              </div>

              <div className="card p-6 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Store className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-ink text-base">Seller Empowerment</h4>
                <p className="text-xs text-graphite leading-relaxed">
                  Dedicated merchant tools, instant catalog management, and seamless payouts for registered sellers.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-white rounded-2xl border border-line p-8 md:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-ink">Ready to start shopping?</h3>
              <p className="text-sm text-graphite mt-1">Explore our latest deals and top categories today.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/products" className="btn-primary flex items-center gap-2">
                <span>Browse Products</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/seller/register" className="btn-secondary">
                Sell on NovaCart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
