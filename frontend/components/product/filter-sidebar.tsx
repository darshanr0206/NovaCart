"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, ChevronRight, ArrowLeft } from "lucide-react";
import {
  CANONICAL_CATEGORIES,
  getParentCategoryForSlug,
  getCategoryDisplayName,
  ParentCategory,
} from "@/lib/categories";

// ─── Filter types & constants ────────────────────────────────────────────────
type FilterOption = { label: string; value: string };
type FilterSection = {
  key: string;
  label: string;
  type: "checkbox" | "radio";
  param: string;
  options: FilterOption[];
};

const PRICE_RANGES: FilterOption[] = [
  { label: "Under ₹500", value: "0-500" },
  { label: "₹500 – ₹2,000", value: "500-2000" },
  { label: "₹2,000 – ₹10,000", value: "2000-10000" },
  { label: "₹10,000 – ₹30,000", value: "10000-30000" },
  { label: "₹30,000 – ₹70,000", value: "30000-70000" },
  { label: "Above ₹70,000", value: "70000-" },
];

const MOBILE_PRICE_RANGES: FilterOption[] = [
  { label: "Under ₹10,000", value: "0-10000" },
  { label: "₹10,000 – ₹20,000", value: "10000-20000" },
  { label: "₹20,000 – ₹40,000", value: "20000-40000" },
  { label: "₹40,000 – ₹70,000", value: "40000-70000" },
  { label: "Above ₹70,000", value: "70000-" },
];

const RATING_OPTIONS: FilterOption[] = [
  { label: "4★ & above", value: "4" },
  { label: "3★ & above", value: "3" },
  { label: "2★ & above", value: "2" },
];

const DISCOUNT_OPTIONS: FilterOption[] = [
  { label: "50% or more", value: "50" },
  { label: "30% or more", value: "30" },
  { label: "20% or more", value: "20" },
  { label: "10% or more", value: "10" },
];

// Fallback brands per category if not dynamically provided
const FALLBACK_BRANDS: Record<string, string[]> = {
  mobiles: ["Apple", "Samsung", "OnePlus", "Redmi", "Vivo", "Realme", "Motorola", "Poco", "iQOO", "Google", "Oppo", "Nokia"],
  electronics: ["Sony", "Dell", "HP", "Lenovo", "Asus", "Bose", "JBL", "boAt", "Logitech", "Philips", "Zebronics", "Noise", "Fire-Boltt"],
  fashion: ["Allen Solly", "Peter England", "Van Heusen", "Levi's", "W", "Biba", "Fabindia", "Aurelia", "MAX", "Raymond", "US Polo", "Park Avenue"],
  "shoes-footwear": ["Nike", "Adidas", "Puma", "Reebok", "Red Tape", "Bata", "Woodland", "Crocs", "Sparx", "Campus", "Asian"],
  "books-stationery": ["Penguin", "HarperCollins", "Rupa", "Classmate", "Camlin", "Doms", "Parker", "Navneet", "Skybags", "American Tourister"],
  "home-kitchen": ["Prestige", "Hawkins", "Milton", "Pigeon", "Philips", "Bajaj", "Butterfly", "Cello", "Wakefit", "Bombay Dyeing"],
  "beauty-personal-care": ["L'Oréal Paris", "Maybelline", "Lakme", "Minimalist", "Biotique", "Nivea", "Dove", "Mamaearth", "The Derma Co", "Cetaphil"],
  "furniture-home-decor": ["Wakefit", "IKEA", "Home Centre", "Nilkamal", "Story@Home", "Urban Ladder", "Spaces", "Solimo"],
  "toys-kids": ["LEGO", "Hot Wheels", "Barbie", "Funskool", "Hasbro", "Fisher-Price", "Nerf", "Pampers", "Huggies", "MamyPoko"],
  "sports-fitness": ["Nivia", "Yonex", "Cosco", "Boldfit", "Strauss", "SG", "SS", "Kobo", "Vector X", "Decathlon"],
  "groceries-household": ["Tata", "Aashirvaad", "Fortune", "Nestle", "Amul", "Britannia", "Dabur", "Surf Excel", "Ariel", "Vim"],
};

// ─── Subcategory Navigation Component ─────────────────────────────────────────
function SubcategoryNav({
  activeCategorySlug,
  searchParams,
}: {
  activeCategorySlug?: string;
  searchParams: Record<string, string>;
}) {
  const [open, setOpen] = useState(true);
  const parentCat = activeCategorySlug ? getParentCategoryForSlug(activeCategorySlug) : undefined;

  // Build url helper while preserving search keywords & sorts
  const buildUrl = (newCategorySlug?: string) => {
    const params = new URLSearchParams();
    if (newCategorySlug) params.set("category", newCategorySlug);
    if (searchParams.keyword) params.set("keyword", searchParams.keyword);
    if (searchParams.sortBy) params.set("sortBy", searchParams.sortBy);
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="border-b border-line pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-xs font-bold text-ink uppercase tracking-wider"
      >
        <span>Categories</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
      </button>

      {open && (
        <div className="mt-1 space-y-1">
          {parentCat ? (
            <div>
              {/* Back to all categories link */}
              <Link
                href={buildUrl(undefined)}
                className="flex items-center gap-1.5 text-xs text-graphite hover:text-nova-600 transition-colors py-1 group"
              >
                <ArrowLeft className="h-3 w-3 text-gray-400 group-hover:text-nova-600 transition-colors" />
                <span>All Categories</span>
              </Link>

              {/* Current parent department header */}
              <div className="mt-2 mb-1.5 px-2 py-1.5 rounded bg-slate-50 border border-slate-200/60">
                <Link
                  href={buildUrl(parentCat.slug)}
                  className={`flex items-center justify-between text-xs font-bold ${
                    activeCategorySlug === parentCat.slug ? "text-nova-600" : "text-ink hover:text-nova-600"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{parentCat.emoji}</span>
                    <span>{parentCat.name}</span>
                  </span>
                  {activeCategorySlug === parentCat.slug && (
                    <span className="h-1.5 w-1.5 rounded-full bg-nova-600" />
                  )}
                </Link>
              </div>

              {/* Subcategories list */}
              <div className="pl-3 mt-1 space-y-0.5 border-l-2 border-slate-200 ml-2">
                <Link
                  href={buildUrl(parentCat.slug)}
                  className={`block text-xs py-1 px-2 rounded transition-colors ${
                    activeCategorySlug === parentCat.slug
                      ? "font-semibold text-nova-600 bg-nova-50"
                      : "text-slate-600 hover:text-ink hover:bg-slate-50"
                  }`}
                >
                  All {parentCat.name}
                </Link>
                {parentCat.subcategories.map((sub) => {
                  const isActive = activeCategorySlug === sub.slug;
                  return (
                    <Link
                      key={sub.slug}
                      href={buildUrl(sub.slug)}
                      className={`block text-xs py-1 px-2 rounded transition-colors ${
                        isActive
                          ? "font-semibold text-nova-600 bg-nova-50"
                          : "text-slate-600 hover:text-ink hover:bg-slate-50"
                      }`}
                    >
                      {sub.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            // No category selected: show all 11 categories
            <div className="space-y-0.5">
              {CANONICAL_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={buildUrl(cat.slug)}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded text-slate-700 hover:text-nova-600 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </span>
                  <ChevronRight className="h-3 w-3 text-gray-300" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Brand Filter Section with Search ─────────────────────────────────
function BrandFilterGroup({
  brands,
  selectedBrand,
}: {
  brands: string[];
  selectedBrand?: string;
}) {
  const [open, setOpen] = useState(true);
  const [brandSearch, setBrandSearch] = useState("");

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands.slice(0, 30);
    const q = brandSearch.trim().toLowerCase();
    return brands.filter((b) => b.toLowerCase().includes(q)).slice(0, 30);
  }, [brands, brandSearch]);

  if (!brands || brands.length === 0) return null;

  return (
    <div className="border-b border-line pb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-xs font-bold text-ink uppercase tracking-wider"
      >
        <span>Brand</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {brands.length > 8 && (
            <div className="relative mb-2">
              <input
                type="text"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Search brand..."
                className="w-full pl-7 pr-2 py-1 text-xs border border-line rounded bg-mist focus:border-nova-400 outline-none"
              />
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2 top-2" />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {filteredBrands.map((brand) => {
              const isChecked = selectedBrand?.toLowerCase() === brand.toLowerCase();
              return (
                <label
                  key={brand}
                  className="flex items-center gap-2 text-xs text-graphite cursor-pointer hover:text-ink py-0.5"
                >
                  <input
                    type="checkbox"
                    name="brand"
                    value={brand}
                    defaultChecked={isChecked}
                    className="accent-nova-600 rounded h-3.5 w-3.5"
                  />
                  <span className={isChecked ? "font-semibold text-nova-700" : ""}>{brand}</span>
                </label>
              );
            })}
            {filteredBrands.length === 0 && (
              <p className="text-xs text-gray-400 py-1">No matching brand</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Standard Collapsible Filter Section ─────────────────────────────────────
function FilterGroup({
  section,
  searchParams,
}: {
  section: FilterSection;
  searchParams: Record<string, string>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-line pb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-xs font-bold text-ink uppercase tracking-wider"
      >
        <span>{section.label}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
      </button>

      {open && section.options && (
        <div className="mt-2 flex flex-col gap-1.5">
          {section.type === "radio" && (
            <label className="flex items-center gap-2 text-xs text-graphite cursor-pointer">
              <input
                type="radio"
                name={section.param}
                value=""
                defaultChecked={!searchParams[section.param]}
                className="accent-nova-600"
              />
              <span>All</span>
            </label>
          )}
          {section.options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-xs text-graphite cursor-pointer hover:text-ink py-0.5"
            >
              {section.type === "radio" ? (
                <input
                  type="radio"
                  name={section.param}
                  value={opt.value}
                  defaultChecked={searchParams[section.param] === opt.value}
                  className="accent-nova-600"
                />
              ) : (
                <input
                  type="checkbox"
                  name={section.param}
                  value={opt.value}
                  defaultChecked={searchParams[section.param] === opt.value}
                  className="accent-nova-600 rounded h-3.5 w-3.5"
                />
              )}
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main FilterSidebar Component ─────────────────────────────────────────────
interface FilterSidebarProps {
  categorySlug?: string;
  searchParams: Record<string, string>;
  totalResults?: number;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
  availableBrands?: string[];
}

export function FilterSidebar({
  categorySlug,
  searchParams,
  totalResults,
  mobileOnly,
  desktopOnly,
  availableBrands,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  // Find parent category to identify appropriate attributes and price brackets
  const parentCat = categorySlug ? getParentCategoryForSlug(categorySlug) : undefined;
  const isMobileDepartment = parentCat?.slug === "mobiles" || categorySlug === "mobiles" || categorySlug === "smartphones";

  // Build brand list: prioritize dynamically fetched brands from DB, fallback to curated list
  const effectiveBrands = useMemo(() => {
    if (availableBrands && availableBrands.length > 0) {
      return availableBrands;
    }
    const catKey = parentCat?.slug || categorySlug || "mobiles";
    return FALLBACK_BRANDS[catKey] || [];
  }, [availableBrands, parentCat, categorySlug]);

  // Specifications filters (e.g. RAM/Storage for phones, Size for fashion, etc.)
  const specSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [];

    if (isMobileDepartment) {
      sections.push({
        key: "ram",
        label: "RAM",
        type: "checkbox",
        param: "size",
        options: [
          { label: "4 GB", value: "4 GB" },
          { label: "6 GB", value: "6 GB" },
          { label: "8 GB", value: "8 GB" },
          { label: "12 GB", value: "12 GB" },
          { label: "16 GB", value: "16 GB" },
        ],
      });
      sections.push({
        key: "storage",
        label: "Internal Storage",
        type: "checkbox",
        param: "size",
        options: [
          { label: "64 GB", value: "64 GB" },
          { label: "128 GB", value: "128 GB" },
          { label: "256 GB", value: "256 GB" },
          { label: "512 GB", value: "512 GB" },
          { label: "1 TB", value: "1 TB" },
        ],
      });
    } else if (parentCat?.slug === "fashion" || categorySlug === "fashion") {
      sections.push({
        key: "size",
        label: "Size",
        type: "checkbox",
        param: "size",
        options: [
          { label: "S", value: "S" },
          { label: "M", value: "M" },
          { label: "L", value: "L" },
          { label: "XL", value: "XL" },
          { label: "XXL", value: "XXL" },
        ],
      });
      sections.push({
        key: "gender",
        label: "Gender",
        type: "checkbox",
        param: "color",
        options: [
          { label: "Men", value: "Men" },
          { label: "Women", value: "Women" },
          { label: "Kids", value: "Kids" },
        ],
      });
    } else if (parentCat?.slug === "shoes-footwear" || categorySlug === "shoes-footwear") {
      sections.push({
        key: "shoeSize",
        label: "UK Size",
        type: "checkbox",
        param: "size",
        options: [
          { label: "UK 6", value: "UK 6" },
          { label: "UK 7", value: "UK 7" },
          { label: "UK 8", value: "UK 8" },
          { label: "UK 9", value: "UK 9" },
          { label: "UK 10", value: "UK 10" },
          { label: "UK 11", value: "UK 11" },
        ],
      });
    }

    return sections;
  }, [isMobileDepartment, parentCat, categorySlug]);

  const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    // Preserve existing category & keyword from searchParams
    if (searchParams.category) params.set("category", searchParams.category);
    if (searchParams.keyword) params.set("keyword", searchParams.keyword);
    if (searchParams.sortBy) params.set("sortBy", searchParams.sortBy);

    formData.forEach((value, key) => {
      const valStr = value.toString().trim();
      if (!valStr) return;
      // Skip fields already preserved
      if (key === "category" || key === "keyword" || key === "sortBy") return;
      params.append(key, valStr);
    });

    router.push(`/products?${params.toString()}`);
    setMobileOpen(false);
  };

  const handleClear = () => {
    // Keep category or keyword when clearing filters
    const params = new URLSearchParams();
    if (searchParams.category) params.set("category", searchParams.category);
    if (searchParams.keyword) params.set("keyword", searchParams.keyword);
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
    setMobileOpen(false);
  };

  const filterContent = (
    <div className="flex flex-col gap-4">
      {/* 1. Category & Subcategory Navigation */}
      <SubcategoryNav activeCategorySlug={categorySlug} searchParams={searchParams} />

      {/* 2. Interactive Filter Form */}
      <form action="/products" onChange={handleFilterChange} className="flex flex-col gap-4">
        {/* Preserve search context */}
        {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
        {searchParams.keyword && <input type="hidden" name="keyword" value={searchParams.keyword} />}
        {searchParams.sortBy && <input type="hidden" name="sortBy" value={searchParams.sortBy} />}

        {/* Brand Filter */}
        <BrandFilterGroup brands={effectiveBrands} selectedBrand={searchParams.brand} />

        {/* Price Range Filter */}
        <FilterGroup
          section={{
            key: "price",
            label: "Price Range",
            type: "radio",
            param: "priceRange",
            options: isMobileDepartment ? MOBILE_PRICE_RANGES : PRICE_RANGES,
          }}
          searchParams={searchParams}
        />

        {/* Custom Price Inputs */}
        <div className="border-b border-line pb-4">
          <div className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
            Custom Price (₹)
          </div>
          <div className="flex items-center gap-2">
            <input
              name="minPrice"
              defaultValue={searchParams.minPrice}
              placeholder="Min"
              className="w-full border border-line rounded px-2 py-1 text-xs outline-none bg-mist focus:border-nova-400"
            />
            <span className="text-gray-400 text-xs shrink-0">to</span>
            <input
              name="maxPrice"
              defaultValue={searchParams.maxPrice}
              placeholder="Max"
              className="w-full border border-line rounded px-2 py-1 text-xs outline-none bg-mist focus:border-nova-400"
            />
          </div>
        </div>

        {/* Specification Attributes (RAM, Storage, Size, etc.) */}
        {specSections.map((section) => (
          <FilterGroup key={section.key} section={section} searchParams={searchParams} />
        ))}

        {/* Discount Filter */}
        <FilterGroup
          section={{
            key: "discount",
            label: "Discount",
            type: "radio",
            param: "minDiscount",
            options: DISCOUNT_OPTIONS,
          }}
          searchParams={searchParams}
        />

        {/* Customer Rating Filter */}
        <FilterGroup
          section={{
            key: "rating",
            label: "Customer Rating",
            type: "radio",
            param: "minRating",
            options: RATING_OPTIONS,
          }}
          searchParams={searchParams}
        />

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 bg-nova-600 text-white font-medium py-2 rounded hover:bg-nova-700 text-xs md:hidden"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 px-3 py-2 border border-line rounded text-xs text-graphite hover:border-ink hover:text-ink text-center transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {!mobileOnly && (
        <aside className="hidden md:block w-64 shrink-0 bg-white shadow-sm border border-line p-4 h-fit sticky top-20 rounded-sm">
          <div className="flex items-center justify-between mb-4 border-b border-line pb-2">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-nova-600" />
              <span>Filters</span>
            </h2>
            {(searchParams.brand || searchParams.priceRange || searchParams.minPrice || searchParams.minRating || searchParams.minDiscount || searchParams.size) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-nova-600 hover:text-nova-700 font-semibold"
              >
                Reset All
              </button>
            )}
          </div>
          {filterContent}
        </aside>
      )}

      {/* Mobile filter button */}
      {!desktopOnly && (
        <div className="md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 border border-line bg-white rounded-sm px-3.5 py-1.5 text-xs font-medium text-ink hover:border-ink shadow-sm"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-nova-600" />
            <span>Filters {totalResults !== undefined && `(${totalResults.toLocaleString("en-IN")})`}</span>
          </button>

          {/* Mobile filter drawer */}
          {mobileOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
              <div className="relative w-80 max-w-full bg-white h-full overflow-y-auto shadow-xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-line sticky top-0 bg-white z-10">
                  <span className="font-bold text-ink text-sm flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-nova-600" />
                    <span>Filters</span>
                  </span>
                  <button onClick={() => setMobileOpen(false)} className="text-graphite hover:text-ink p-1">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4 flex-1">{filterContent}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
