import { Product } from "@/types";
import { ProductCard } from "./product-card";

export function ProductGrid({ products, emptyMessage = "No products found." }: { products: Product[]; emptyMessage?: string }) {
  if (products.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 p-16 text-center">
        <span className="text-4xl">🔍</span>
        <p className="text-sm text-graphite">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
