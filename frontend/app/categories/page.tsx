import Link from "next/link";
import { Sparkles, Heart, ShoppingBag } from "lucide-react";

export const metadata = {
  title: "Shop By Category — NovaCart",
  description: "Browse thousands of products across Men, Women, Kids, Mobiles, Electronics, Footwear, Jewellery, Beauty, Groceries and more.",
};

// Exact 11 Visual Category Cards matching user reference image
const VISUAL_CATEGORY_CARDS = [
  {
    name: "Groceries & Household Essentials",
    slug: "groceries-household",
    image: "/images/categories/groceries-household.png",
  },
  {
    name: "Mobiles",
    slug: "mobiles",
    image: "/images/categories/mobiles.png",
  },
  {
    name: "Electronics",
    slug: "electronics",
    image: "/images/categories/electronics.png",
  },
  {
    name: "Clothing & Fashion",
    slug: "fashion",
    image: "/images/categories/fashion.png",
  },
  {
    name: "Shoes & Footwear",
    slug: "shoes-footwear",
    image: "/images/categories/shoes-footwear.png",
  },
  {
    name: "Books & Stationery",
    slug: "books-stationery",
    image: "/images/categories/books-stationery.png",
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    image: "/images/categories/home-kitchen.png",
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    image: "/images/categories/beauty-personal-care.png",
  },
  {
    name: "Furniture & Home Decor",
    slug: "furniture-home-decor",
    image: "/images/categories/furniture-home-decor.png",
  },
  {
    name: "Toys & Kids",
    slug: "toys-kids",
    image: "/images/categories/toys-kids.png",
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    image: "/images/categories/sports-fitness.png",
    fullWidth: true,
  },
];

export default function CategoriesCatalogPage() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-16">
      <div className="container-content py-3 sm:py-6 space-y-6">
        
        {/* Top Header Matching Reference Image: "Shop By Category" */}
        <div className="flex items-center justify-between py-2 sm:py-3 border-b border-slate-200/80">
          <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
            Shop By Category
          </h1>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/products"
              className="text-ink hover:text-nova-600 transition-colors p-1"
              aria-label="Search"
            >
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.8]" />
            </Link>
            <Link
              href="/wishlist"
              className="text-ink hover:text-nova-600 transition-colors p-1"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.8]" />
            </Link>
            <Link
              href="/cart"
              className="text-ink hover:text-nova-600 transition-colors p-1"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 stroke-[1.8]" />
            </Link>
          </div>
        </div>

        {/* Exact 2-Column Category Grid Matching User Reference Image (2-Col on mobile & desktop, clear & high-DPI) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 max-w-4xl mx-auto">
          {VISUAL_CATEGORY_CARDS.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className={`block rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-200 transform active:scale-[0.985] sm:hover:-translate-y-0.5 group border border-slate-200/70 bg-white ${
                cat.fullWidth ? "col-span-2" : "col-span-1"
              }`}
            >
              <img
                src={cat.image}
                alt={cat.name}
                width={cat.fullWidth ? 1929 : 948}
                height={cat.fullWidth ? 375 : 387}
                loading="eager"
                decoding="async"
                className="w-full h-auto object-contain rounded-xl sm:rounded-2xl transition-transform duration-200 group-hover:scale-[1.01]"
                style={{
                  imageRendering: "-webkit-optimize-contrast",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                }}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
