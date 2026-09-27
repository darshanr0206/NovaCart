import { getRecommendedForYou } from "@/services/product-service";
import { ProductCard } from "@/components/product/product-card";
import { Product } from "@/types";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export async function RecommendedSection() {
  let products: Product[] = [];
  try {
    products = await getRecommendedForYou(8);
  } catch {
    products = [];
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="mt-10 mb-6 bg-white border border-line rounded-lg shadow-xs p-6">
      <div className="flex items-center justify-between mb-5 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Recommended For You</h2>
            <p className="text-xs text-graphite">Personalized top picks across authentic marketplace categories</p>
          </div>
        </div>
        <Link
          href="/products"
          className="text-xs font-semibold text-nova-600 hover:text-nova-700 flex items-center gap-1 transition-colors"
        >
          <span>Explore All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
