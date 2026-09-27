import {
  getProduct,
  getSimilarProducts,
  getCompleteTheLook,
  getFrequentlyBoughtTogether,
} from "@/services/product-service";
import { ProductActions } from "@/components/product/product-actions";
import { ImageGallery, StarRating } from "@/components/product/image-gallery";
import { BundleSection } from "@/components/product/bundle-section";
import { CompleteLookSection } from "@/components/product/complete-look-section";
import { formatINR } from "@/lib/utils";
import { Truck, ShieldCheck, RefreshCcw, Tag, ChevronRight, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";

import { getParentCategoryForSlug } from "@/lib/categories";

// Parse specification JSON or newline text
function parseSpecs(specText: string): Array<{ key: string; value: string }> {
  if (!specText) return [];
  try {
    const obj = JSON.parse(specText);
    if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    }
  } catch {
    // Plain text fallback
  }

  return specText
    .split("\n")
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return null;
      return {
        key: line.slice(0, idx).trim(),
        value: line.slice(idx + 1).trim(),
      };
    })
    .filter(Boolean) as Array<{ key: string; value: string }>;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  let product;
  try {
    product = await getProduct(params.id);
  } catch {
    notFound();
  }
  if (!product) notFound();

  const categoryId = product.categoryId;
  const specs = parseSpecs(product.specifications ?? "");
  const hasDiscount = product.discountPercent > 0;
  const discountAmount = hasDiscount ? Math.round(Number(product.discountPercent)) : 0;
  const savings = hasDiscount
    ? Number(product.price) - Number(product.effectivePrice)
    : 0;

  // Fetch all recommendation streams in parallel
  const [similarProducts, frequentlyBoughtTogether, completeTheLook] = await Promise.all([
    getSimilarProducts(product.id, 8),
    getFrequentlyBoughtTogether(product.id),
    getCompleteTheLook(product.id),
  ]);

  return (
    <div className="container-content py-6">
      {/* Breadcrumb */}
      {(() => {
        const parentCat = product.categorySlug ? getParentCategoryForSlug(product.categorySlug) : undefined;
        return (
          <nav className="mb-5 flex items-center gap-1 text-sm text-graphite flex-wrap">
            <Link href="/" className="hover:text-nova-600 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <Link href="/products" className="hover:text-nova-600 transition-colors">All Products</Link>
            {parentCat && parentCat.slug !== product.categorySlug && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                <Link href={`/products?category=${parentCat.slug}`} className="hover:text-nova-600 transition-colors">
                  {parentCat.name}
                </Link>
              </>
            )}
            {product.categorySlug ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                <Link href={`/products?category=${product.categorySlug}`} className="hover:text-nova-600 transition-colors">
                  {product.categoryName}
                </Link>
              </>
            ) : product.categoryName ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                <Link href={`/products?categoryId=${categoryId}`} className="hover:text-nova-600 transition-colors">
                  {product.categoryName}
                </Link>
              </>
            ) : null}
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-ink font-medium line-clamp-1">{product.name}</span>
          </nav>
        );
      })()}

      {/* Product layout */}
      <div className="bg-white rounded-sm border border-line shadow-sm p-4 sm:p-6 grid gap-6 sm:gap-10 md:grid-cols-2">
        {/* Left — image gallery */}
        <ImageGallery images={product.images ?? []} productName={product.name} />

        {/* Right — product info */}
        <div className="flex flex-col gap-4">
          {/* Brand + category */}
          <div className="flex items-center gap-2 text-sm text-graphite flex-wrap">
            {product.brand && product.brand !== "NovaBrand" && (
              <span className="font-semibold text-nova-600">{product.brand}</span>
            )}
            {product.brand && product.brand !== "NovaBrand" && <span>·</span>}
            {categoryId ? (
              <Link href={`/products?categoryId=${categoryId}`} className="hover:text-nova-600 hover:underline">
                {product.categoryName}
              </Link>
            ) : (
              <span>{product.categoryName}</span>
            )}
            <span>·</span>
            <span>Sold by <strong className="text-ink">{product.sellerName || "NovaCart Verified Seller"}</strong></span>
          </div>

          {/* Product name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-ink leading-tight">{product.name}</h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <StarRating rating={product.averageRating ?? 0} count={product.reviewCount} />
          )}

          {/* Price block */}
          <div className="border-t border-b border-line py-4 space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-ink">{formatINR(product.effectivePrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-graphite line-through">{formatINR(product.price)}</span>
                  <span className="text-base font-bold text-green-600">{discountAmount}% off</span>
                </>
              )}
            </div>
            {hasDiscount && savings > 0 && (
              <p className="text-sm text-green-600 font-medium">
                You save {formatINR(savings)}!
              </p>
            )}

            {/* Offers */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-start gap-2 text-sm text-graphite">
                <Tag className="h-4 w-4 text-nova-500 shrink-0 mt-0.5" />
                <span><strong className="text-ink">Bank Offer:</strong> 10% instant discount on HDFC & SBI Credit Cards</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-graphite">
                <Tag className="h-4 w-4 text-nova-500 shrink-0 mt-0.5" />
                <span><strong className="text-ink">No Cost EMI:</strong> Available on leading credit cards starting at ₹{Math.round(Number(product.effectivePrice) / 6).toLocaleString("en-IN")}/mo</span>
              </div>
            </div>
          </div>

          {/* Stock status */}
          <p className="text-sm">
            {product.inStock ? (
              <span className="font-medium text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> In Stock ({product.stockQuantity} units available with express delivery)
              </span>
            ) : (
              <span className="font-medium text-red-500">✗ Currently Out of Stock</span>
            )}
          </p>

          {/* Variant info (size/color) */}
          {((product.size && product.size !== "Default" && product.size !== "Standard") ||
            (product.color && product.color !== "Standard")) && (
            <div className="flex flex-wrap gap-4 text-sm bg-mist/40 p-3 rounded-md border border-line">
              {product.color && product.color !== "Standard" && (
                <div>
                  <span className="text-graphite font-medium">Color: </span>
                  <span className="font-bold text-ink">{product.color}</span>
                </div>
              )}
              {product.size && product.size !== "Default" && product.size !== "Standard" && (
                <div>
                  <span className="text-graphite font-medium">Configuration / Size: </span>
                  <span className="font-bold text-ink">{product.size}</span>
                </div>
              )}
            </div>
          )}

          {/* Add to Cart / Buy Now */}
          <ProductActions productId={product.id} inStock={product.inStock} product={product} />

          {/* Delivery & return info */}
          <div className="mt-2 space-y-2.5 border-t border-line pt-4 text-sm text-graphite">
            <div className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-nova-500 shrink-0" />
              <span><strong className="text-ink">Free Express Delivery</strong> on orders above ₹499. Delivers in 2–4 days.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RefreshCcw className="h-4 w-4 text-nova-500 shrink-0" />
              <span><strong className="text-ink">7-Day Easy Returns</strong> — 100% money back guarantee.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-nova-500 shrink-0" />
              <span><strong className="text-ink">100% Authentic Product</strong> sourced directly from verified brands.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together Bundle */}
      <BundleSection bundleProducts={frequentlyBoughtTogether} />

      {/* Complete the Look */}
      <CompleteLookSection products={completeTheLook} />

      {/* Specifications table */}
      {specs.length > 0 && (
        <div className="mt-5 bg-white rounded-sm border border-line shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-ink mb-4 border-b border-line pb-2">Technical Specifications & Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-mist/50" : "bg-white"}>
                    <td className="py-2.5 px-3 font-semibold text-graphite w-36 sm:w-48 md:w-60 whitespace-nowrap text-xs sm:text-sm">{spec.key}</td>
                    <td className="py-2.5 px-3 text-ink font-medium text-xs sm:text-sm">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className="mt-5 bg-white rounded-sm border border-line shadow-sm p-6">
          <h2 className="text-lg font-bold text-ink mb-3 border-b border-line pb-2">About this Item</h2>
          <p className="whitespace-pre-line text-sm text-graphite leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Similar products you may like */}
      {similarProducts.length > 0 && (
        <div className="mt-5 bg-white rounded-sm border border-line shadow-sm p-6">
          <div className="flex items-center justify-between mb-5 border-b border-line pb-3">
            <div>
              <h2 className="text-lg font-bold text-ink">Similar Products You May Like</h2>
              <p className="text-xs text-graphite">Recommended products matched by category, brand & price tier</p>
            </div>
            {categoryId && (
              <Link href={`/products?categoryId=${categoryId}`} className="text-xs font-semibold text-nova-600 hover:text-nova-700">
                View Category Catalog →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
