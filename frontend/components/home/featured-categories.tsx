import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CategoryCard {
  id: string;
  name: string;
  emoji: string;
  image: string;
  href: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: "electronics",
    name: "Electronics",
    emoji: "🎧",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
    href: "/products?category=electronics",
  },
  {
    id: "fashion",
    name: "Fashion",
    emoji: "👗",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=600&auto=format&fit=crop",
    href: "/products?category=fashion",
  },
  {
    id: "home-living",
    name: "Home & Living",
    emoji: "🛋️",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600&auto=format&fit=crop",
    href: "/products?category=home-kitchen",
  },
  {
    id: "sports",
    name: "Sports",
    emoji: "👟",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
    href: "/products?category=sports-fitness",
  },
  {
    id: "beauty",
    name: "Beauty",
    emoji: "✨",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop",
    href: "/products?category=beauty-personal-care",
  },
  {
    id: "books",
    name: "Books",
    emoji: "📚",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop",
    href: "/products?category=books-stationery",
  },
];

export function FeaturedCategories() {
  return (
    <section className="w-full space-y-4">
      {/* Section Header Matching Reference */}
      <div className="flex items-end justify-between px-1">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-nova-600 block mb-0.5">
            BROWSE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink font-display tracking-tight">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/categories"
          className="text-xs sm:text-sm font-semibold text-nova-600 hover:text-nova-700 flex items-center gap-1 transition-colors group"
        >
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Categories Grid (6 vertical photo cards matching reference) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="group relative h-48 sm:h-64 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Background image with smooth zoom effect */}
            <img
              src={cat.image}
              alt={cat.name}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
            />

            {/* Gradient Overlay for high contrast readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

            {/* Label at bottom-left */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
              <span className="text-base sm:text-lg">{cat.emoji}</span>
              <span className="font-bold text-white text-xs sm:text-sm leading-tight drop-shadow-sm tracking-tight truncate">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
