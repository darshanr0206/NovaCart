import { searchProducts } from "@/services/product-service";
import { ProductCard } from "@/components/product/product-card";
import { PageResponse, Product } from "@/types";
import Link from "next/link";
import { Sparkles, Flame, ChevronRight, Tag, Smartphone, Laptop, Dumbbell, Shirt, ShoppingBasket } from "lucide-react";

export const metadata = {
  title: "New Arrivals — NovaCart",
  description: "Explore the latest additions to NovaCart. Discover freshly released smartphones, laptops, sports equipment, trending fashion, and premium essentials.",
};

interface SearchParams {
  category?: string;
  minDiscount?: string;
  sortBy?: string;
  page?: string;
}

const CATEGORY_TABS = [
  { label: "All New", slug: "", icon: Sparkles },
  { label: "Mobiles & 5G", slug: "flagship-mobiles", icon: Smartphone },
  { label: "Laptops & Tech", slug: "laptops", icon: Laptop },
  { label: "Sports & Fitness", slug: "sports-fitness", icon: Dumbbell },
  { label: "Fashion & Apparel", slug: "fashion", icon: Shirt },
  { label: "Groceries & Daily", slug: "groceries-household", icon: ShoppingBasket },
];

export default async function NewArrivalsPage({ searchParams }: { searchParams: SearchParams }) {
  const currentCategory = searchParams.category || "";
  const minDiscountNum = searchParams.minDiscount ? Number(searchParams.minDiscount) : undefined;
  const currentPage = searchParams.page ? Number(searchParams.page) : 0;
  const onlyOffers = Boolean(minDiscountNum);

  let result: PageResponse<Product> = {
    content: [],
    page: 0,
    size: 24,
    totalElements: 0,
    totalPages: 0,
    last: true,
  };

  try {
    result = await searchProducts({
      categorySlug: currentCategory || undefined,
      minDiscount: minDiscountNum,
      sortBy: "newest",
      page: currentPage,
      sizePage: 24,
    });
  } catch (err) {
    console.error("Error loading new arrivals:", err);
  }

  // Deduplicate content by base name in case of any remaining variant collision
  const seenNames = new Set<string>();
  const uniqueProducts: Product[] = [];
  for (const prod of result.content) {
    const baseKey = prod.name.split("(")[0].trim().toLowerCase();
    if (!seenNames.has(baseKey)) {
      seenNames.add(baseKey);
      uniqueProducts.push(prod);
    }
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-20">
      <div className="container-content py-4 sm:py-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-graphite">
          <Link href="/" className="hover:text-nova-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-semibold text-ink">New Arrivals</span>
          {currentCategory && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-nova-600 font-medium capitalize">
                {CATEGORY_TABS.find((t) => t.slug === currentCategory)?.label || currentCategory}
              </span>
            </>
          )}
        </nav>

        {/* Hero Banner with Modern NovaCart Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4F13E2] via-[#6E2CF3] to-[#8F4FFF] p-6 sm:p-10 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              <span>Just Dropped • Fresh Arrivals</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              New Arrivals
            </h1>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-xl">
              Discover the latest releases and newly listed items across smartphones, high-performance tech, athletic gear, and lifestyle essentials.
            </p>
          </div>

          {/* Decorative ambient glow circles */}
          <div className="pointer-events-none absolute -right-12 -bottom-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute right-24 -top-12 h-44 w-44 rounded-full bg-amber-400/20 blur-xl" />
        </div>

        {/* Filter Bar: Category Chips + Offer Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none flex-1">
              {CATEGORY_TABS.map((tab) => {
                const isActive = currentCategory === tab.slug && !onlyOffers;
                const Icon = tab.icon;
                const href = tab.slug ? `/new-arrivals?category=${tab.slug}` : "/new-arrivals";

                return (
                  <Link
                    key={tab.slug || "all"}
                    href={href}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                      isActive
                        ? "bg-[#5C1BFD] text-white shadow-sm ring-2 ring-[#5C1BFD]/20 scale-[1.02]"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}

              {/* Special Filter: New Arrivals on Offer / Discount */}
              <Link
                href={
                  onlyOffers
                    ? `/new-arrivals${currentCategory ? `?category=${currentCategory}` : ""}`
                    : `/new-arrivals?minDiscount=10${currentCategory ? `&category=${currentCategory}` : ""}`
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  onlyOffers
                    ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/20"
                    : "bg-white text-rose-600 border border-rose-200 hover:border-rose-300 hover:bg-rose-50"
                }`}
              >
                <Flame className="h-3.5 w-3.5 fill-current" />
                <span>New with Offers (10%+ off)</span>
              </Link>
            </div>
          </div>

          {/* Subheader with Active Count */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 pt-1">
            <p className="text-xs font-medium text-graphite">
              Showing <span className="font-bold text-ink">{uniqueProducts.length}</span> newly added items
              {currentCategory && <span> in this department</span>}
              {onlyOffers && <span className="text-rose-600 font-semibold"> with launch offers</span>}
            </p>
            <span className="text-[11px] font-semibold text-nova-600 bg-nova-50 px-2 py-0.5 rounded-full">
              Real-time Verified
            </span>
          </div>
        </div>

        {/* Product Grid: 2 Columns on Mobile, 3-4 Columns on Desktop */}
        {uniqueProducts.length === 0 ? (
          <div className="card flex flex-col items-center justify-center gap-3 p-16 text-center bg-white rounded-2xl border border-slate-200">
            <Sparkles className="h-10 w-10 text-[#5C1BFD]/60 animate-pulse" />
            <h3 className="text-base font-bold text-ink">No new arrivals matching this filter</h3>
            <p className="text-xs text-graphite max-w-sm">
              Check back soon as our sellers regularly drop new collections and products.
            </p>
            <Link
              href="/new-arrivals"
              className="mt-2 text-xs font-bold text-nova-600 hover:text-nova-700 underline"
            >
              Reset to All New Arrivals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {uniqueProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {result.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            {currentPage > 0 && (
              <Link
                href={`/new-arrivals?page=${currentPage - 1}${
                  currentCategory ? `&category=${currentCategory}` : ""
                }${minDiscountNum ? `&minDiscount=${minDiscountNum}` : ""}`}
                className="btn-secondary px-4 py-2 text-xs font-bold"
              >
                Previous Page
              </Link>
            )}
            <span className="text-xs text-graphite font-medium px-2">
              Page {currentPage + 1} of {result.totalPages}
            </span>
            {!result.last && (
              <Link
                href={`/new-arrivals?page=${currentPage + 1}${
                  currentCategory ? `&category=${currentCategory}` : ""
                }${minDiscountNum ? `&minDiscount=${minDiscountNum}` : ""}`}
                className="btn-primary px-4 py-2 text-xs font-bold"
              >
                Next Page
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
