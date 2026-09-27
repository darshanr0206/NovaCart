import { searchProducts, getCategoryBrands } from "@/services/product-service";
import { ProductGrid } from "@/components/product/product-grid";
import { SortSelect } from "@/components/product/sort-select";
import { FilterSidebar } from "@/components/product/filter-sidebar";
import { PageResponse, Product } from "@/types";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getCategoryDisplayName, getParentCategoryForSlug } from "@/lib/categories";

interface SearchParams {
  keyword?: string;
  category?: string | string[];     // slug-based navigation (can be array when multiple selected)
  categoryId?: string;   // legacy ID-based navigation still supported
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  sortBy?: string;
  brand?: string;
  color?: string;
  size?: string;
  minDiscount?: string;
  priceRange?: string;
  page?: string;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  let result: PageResponse<Product> = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true };

  // Resolve price range shorthand into minPrice/maxPrice
  let minPriceResolved = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  let maxPriceResolved = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;

  if (searchParams.priceRange) {
    const [min, max] = searchParams.priceRange.split("-");
    if (min) minPriceResolved = Number(min);
    if (max) maxPriceResolved = Number(max);
  }

  // Determine selected category slug
  const rawCat = Array.isArray(searchParams.category)
    ? searchParams.category[searchParams.category.length - 1]
    : searchParams.category;

  try {
    result = await searchProducts({
      keyword: searchParams.keyword ? searchParams.keyword.trim() : undefined,
      categorySlug: rawCat ? rawCat.trim() : undefined,
      categoryId: searchParams.categoryId ? Number(searchParams.categoryId) : undefined,
      minPrice: minPriceResolved,
      maxPrice: maxPriceResolved,
      minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
      sortBy: (searchParams.sortBy as any) ?? "newest",
      brand: searchParams.brand,
      color: searchParams.color,
      size: searchParams.size,
      minDiscount: searchParams.minDiscount ? Number(searchParams.minDiscount) : undefined,
      page: searchParams.page ? Number(searchParams.page) : 0,
      sizePage: 24,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
  }

  // Build page title & category hierarchy
  const categorySlug = rawCat;
  const categoryDisplayName = rawCat ? getCategoryDisplayName(rawCat) : undefined;
  const parentCat = rawCat ? getParentCategoryForSlug(rawCat) : undefined;
  const isSubcategory = !!(parentCat && parentCat.slug !== rawCat);
  const pageTitle = searchParams.keyword
    ? (categoryDisplayName ? `"${searchParams.keyword}" in ${categoryDisplayName}` : `Results for "${searchParams.keyword}"`)
    : (categoryDisplayName ?? "All Products");

  // Fetch dynamic brands from PostgreSQL for this category
  let availableBrands: string[] = [];
  try {
    availableBrands = await getCategoryBrands(rawCat, searchParams.categoryId ? Number(searchParams.categoryId) : undefined);
  } catch (err) {
    console.error("Error fetching category brands:", err);
  }

  // Build searchParams record for filter sidebar and hidden inputs
  const spRecord: Record<string, string> = Object.fromEntries(
    Object.entries(searchParams).filter(([, v]) => v != null)
  ) as Record<string, string>;

  return (
    <div className="container-content py-6 bg-[#f1f3f6] min-h-screen">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-graphite flex-wrap">
        <Link href="/" className="hover:text-nova-600 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <Link href="/products" className="hover:text-nova-600 transition-colors">All Products</Link>
        {isSubcategory && parentCat && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <Link href={`/products?category=${parentCat.slug}`} className="hover:text-nova-600 transition-colors">
              {parentCat.name}
            </Link>
          </>
        )}
        {categoryDisplayName && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-ink font-medium">{categoryDisplayName}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col md:flex-row gap-5">
        {/* Filter sidebar */}
        <FilterSidebar
          categorySlug={categorySlug}
          searchParams={spRecord}
          totalResults={result.totalElements}
          desktopOnly={true}
          availableBrands={availableBrands}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="mb-4 bg-white px-4 py-3 shadow-sm border border-line rounded-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-bold text-ink">{pageTitle}</h1>
              <p className="text-xs text-graphite mt-0.5">
                {result.totalElements > 0
                  ? `Showing ${result.content.length} of ${result.totalElements.toLocaleString("en-IN")} products`
                  : "No products found"}
              </p>
            </div>

            {/* Sort + mobile filter row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Mobile filter button (rendered by FilterSidebar) */}
              <FilterSidebar
                categorySlug={categorySlug}
                searchParams={spRecord}
                totalResults={result.totalElements}
                mobileOnly={true}
                availableBrands={availableBrands}
              />

              <form action="/products" className="flex items-center gap-2">
                {searchParams.keyword && <input type="hidden" name="keyword" value={searchParams.keyword} />}
                {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
                {searchParams.categoryId && <input type="hidden" name="categoryId" value={searchParams.categoryId} />}
                {minPriceResolved && <input type="hidden" name="minPrice" value={String(minPriceResolved)} />}
                {maxPriceResolved && <input type="hidden" name="maxPrice" value={String(maxPriceResolved)} />}
                {searchParams.minRating && <input type="hidden" name="minRating" value={searchParams.minRating} />}
                {searchParams.brand && <input type="hidden" name="brand" value={searchParams.brand} />}
                {searchParams.color && <input type="hidden" name="color" value={searchParams.color} />}
                {searchParams.size && <input type="hidden" name="size" value={searchParams.size} />}
                {searchParams.minDiscount && <input type="hidden" name="minDiscount" value={searchParams.minDiscount} />}
                <span className="text-sm font-medium text-ink hidden sm:inline">Sort By</span>
                <SortSelect defaultValue={searchParams.sortBy ?? "newest"} />
              </form>
            </div>
          </div>

          {/* Active filter pills */}
          {(searchParams.brand || searchParams.minRating || searchParams.minDiscount || searchParams.priceRange) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {searchParams.brand && (
                <span className="flex items-center gap-1 rounded-full bg-nova-50 border border-nova-100 px-3 py-1 text-xs font-medium text-nova-700">
                  Brand: {searchParams.brand}
                  <Link href={`/products?${new URLSearchParams({ ...spRecord, brand: "" }).toString()}`} className="ml-1 text-nova-500 hover:text-nova-700">×</Link>
                </span>
              )}
              {searchParams.minRating && (
                <span className="flex items-center gap-1 rounded-full bg-nova-50 border border-nova-100 px-3 py-1 text-xs font-medium text-nova-700">
                  Rating: {searchParams.minRating}★+
                  <Link href={`/products?${new URLSearchParams({ ...spRecord, minRating: "" }).toString()}`} className="ml-1 text-nova-500 hover:text-nova-700">×</Link>
                </span>
              )}
              {searchParams.minDiscount && (
                <span className="flex items-center gap-1 rounded-full bg-nova-50 border border-nova-100 px-3 py-1 text-xs font-medium text-nova-700">
                  Discounted
                  <Link href={`/products?${new URLSearchParams({ ...spRecord, minDiscount: "" }).toString()}`} className="ml-1 text-nova-500 hover:text-nova-700">×</Link>
                </span>
              )}
            </div>
          )}

          {/* Product grid */}
          <div className="bg-white p-4 shadow-sm border border-line rounded-sm">
            <ProductGrid
              products={result.content}
              emptyMessage={`No products found${categoryDisplayName ? ` in ${categoryDisplayName}` : ""}. Try adjusting your filters.`}
            />
          </div>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {Array.from({ length: Math.min(result.totalPages, 8) }, (_, i) => i).map((i) => (
                <Link
                  key={i}
                  href={`/products?${new URLSearchParams({ ...spRecord, page: String(i) }).toString()}`}
                  className={`h-9 w-9 flex items-center justify-center rounded border text-sm font-medium transition-colors ${
                    result.page === i
                      ? "bg-nova-600 text-white border-nova-600"
                      : "bg-white text-ink border-line hover:border-ink"
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
