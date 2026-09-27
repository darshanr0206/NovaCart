import { searchProducts } from "@/services/product-service";
import { ProductGrid } from "@/components/product/product-grid";
import { PageResponse, Product } from "@/types";
import Link from "next/link";
import { Flame, Percent, Tag, Zap, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Deals & Offers — NovaCart",
  description: "Grab the biggest savings of the season. Save up to 50%+ on smartphones, electronics, fashion, groceries, and more.",
};

interface SearchParams {
  minDiscount?: string;
  category?: string;
  sortBy?: string;
  page?: string;
}

export default async function DealsPage({ searchParams }: { searchParams?: SearchParams }) {
  const sp = searchParams || {};
  const minDiscountNum = sp.minDiscount ? Number(sp.minDiscount) : 10;

  let result: PageResponse<Product> = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true };
  try {
    result = await searchProducts({
      minDiscount: minDiscountNum,
      categorySlug: sp.category,
      sortBy: "discount",
      page: sp.page ? Number(sp.page) : 0,
      sizePage: 24,
    });
  } catch (err) {
    console.error("Error loading deals:", err);
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container-content space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white rounded-2xl p-8 md:p-12 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-xs text-white text-xs font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 fill-current" />
              Flash Clearance Hub
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Mega Deals & Savings
            </h1>
            <p className="text-sm md:text-base text-white/90 leading-relaxed">
              Unbeatable prices on verified products across top brands. Grab limited-time discounts before stock runs out!
            </p>
          </div>
        </div>

        {/* Discount Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { label: "All Deals (10%+ Off)", discount: "10" },
            { label: "Min 20% Off", discount: "20" },
            { label: "Min 30% Off", discount: "30" },
            { label: "Min 40% Off", discount: "40" },
            { label: "Min 50% Off & Above", discount: "50" },
          ].map((tier) => {
            const isActive = String(minDiscountNum) === tier.discount;
            return (
              <Link
                key={tier.discount}
                href={`/deals?minDiscount=${tier.discount}${sp.category ? `&category=${sp.category}` : ""}`}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-white text-graphite border border-line hover:border-rose-300"
                }`}
              >
                <Percent className="h-3.5 w-3.5" />
                <span>{tier.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Category Deal Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Mobiles", slug: "mobiles", icon: "📱" },
            { label: "Electronics", slug: "electronics", icon: "💻" },
            { label: "Fashion", slug: "fashion", icon: "👕" },
            { label: "Shoes", slug: "shoes-footwear", icon: "👟" },
            { label: "Groceries", slug: "groceries-household", icon: "🍎" },
            { label: "Home", slug: "home-kitchen", icon: "🏠" },
          ].map((c) => (
            <Link
              key={c.slug}
              href={`/deals?category=${c.slug}&minDiscount=${minDiscountNum}`}
              className={`card p-3 text-center hover:border-nova-400 transition ${
                sp.category === c.slug ? "border-nova-600 bg-nova-50/50" : ""
              }`}
            >
              <span className="text-xl block mb-1">{c.icon}</span>
              <span className="text-xs font-bold text-ink">{c.label}</span>
            </Link>
          ))}
        </div>

        {/* Product Grid Results */}
        <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-line">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Tag className="h-5 w-5 text-rose-600" />
                Special Discount Offers
              </h2>
              <p className="text-xs text-graphite mt-0.5">
                Showing {result.content?.length || 0} of {(result.totalElements || 0).toLocaleString("en-IN")} discounted products
              </p>
            </div>
          </div>

          <ProductGrid products={result.content || []} />
        </div>
      </div>
    </div>
  );
}
