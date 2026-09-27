import Link from "next/link";
import { Logo } from "./logo";
import { ShieldCheck, Truck, Headphones, RotateCcw } from "lucide-react";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Deals & Offers", href: "/deals" },
      { label: "All Categories", href: "/categories" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Become a Seller", href: "/seller/register" },
      { label: "Seller Dashboard", href: "/seller" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Track an Order", href: "/orders" },
      { label: "Returns & Refunds", href: "/returns" },
      { label: "Contact Us", href: "/contact" },
      { label: "Help Center & FAQs", href: "/support" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About NovaCart", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Shipping Policy", href: "/shipping" },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Shipping Policy", href: "/shipping" },
  { label: "Returns & Refunds", href: "/returns" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 sm:mt-20 border-t border-line bg-white pb-16 md:pb-0">
      {/* Platform Trust Highlights */}
      <div className="border-b border-line bg-slate-50/70">
        <div className="container-content py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-nova-100 text-nova-700 flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-ink">Free Delivery</h5>
              <p className="text-[11px] text-graphite mt-0.5">On all orders above ₹499</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-ink">7-Day Returns</h5>
              <p className="text-[11px] text-graphite mt-0.5">Hassle-free doorstep pickup</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-ink">100% Secure</h5>
              <p className="text-[11px] text-graphite mt-0.5">PCI-DSS Razorpay payments</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-ink">24/7 Support</h5>
              <p className="text-[11px] text-graphite mt-0.5">Dedicated customer help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container-content grid gap-10 py-12 md:grid-cols-[1.3fr_2fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-xs text-graphite leading-relaxed">
            Many sellers. One cart. India&apos;s trusted marketplace connecting verified independent merchants with millions of customers nationwide.
          </p>
          <div className="text-xs text-slate-400">
            Powered by modern microservices architecture & Razorpay secure transactions.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">{col.title}</h4>
              <ul className="mt-3.5 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-graphite hover:text-nova-600 transition-colors block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-line py-6 bg-slate-50/50">
        <div className="container-content flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-graphite">
          <p>© {new Date().getFullYear()} NovaCart Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-ink transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
