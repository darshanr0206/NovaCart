import Link from "next/link";
import { Home, Tag, Headphones, ShoppingBag, Smartphone, Tv, Shirt, Book, Coffee, Smile, Sofa, Baby, Dumbbell, Store } from "lucide-react";
import { Footprints } from "lucide-react";

const CATEGORIES = [
  { name: "Groceries & Household", icon: ShoppingBag, slug: "groceries-household" },
  { name: "Mobiles", icon: Smartphone, slug: "mobiles" },
  { name: "Electronics", icon: Tv, slug: "electronics" },
  { name: "Fashion", icon: Shirt, slug: "fashion" },
  { name: "Shoes & Footwear", icon: Footprints, slug: "shoes-footwear" },
  { name: "Books & Stationery", icon: Book, slug: "books-stationery" },
  { name: "Home & Kitchen", icon: Coffee, slug: "home-kitchen" },
  { name: "Beauty & Personal Care", icon: Smile, slug: "beauty-personal-care" },
  { name: "Furniture & Home Decor", icon: Sofa, slug: "furniture-home-decor" },
  { name: "Toys & Kids", icon: Baby, slug: "toys-kids" },
  { name: "Sports & Fitness", icon: Dumbbell, slug: "sports-fitness" },
];

export function HomeSidebar() {
  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block bg-white border-r border-line py-4 h-[calc(100vh-4rem)] overflow-y-auto sticky top-16">
      <div className="px-3 pb-4 border-b border-line mb-4">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 bg-nova-50 text-nova-600 rounded-md font-medium text-sm">
          <Home className="w-4 h-4" />
          Home
        </Link>
      </div>
      
      <div className="px-3">
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Categories</h3>
        <ul className="space-y-1">
          {CATEGORIES.map((cat) => (
            <li key={cat.slug}>
              <Link href={`/products?category=${cat.slug}`} className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-mist hover:text-ink rounded-md text-sm transition-colors">
                <cat.icon className="w-4 h-4 text-gray-400" />
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-3 mt-6 pt-6 border-t border-line">
        <ul className="space-y-1">
          <li>
            <Link href="/products?minDiscount=10&sortBy=discount" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-mist hover:text-ink rounded-md text-sm transition-colors">
              <Tag className="w-4 h-4 text-gray-400" />
              Deals & Offers
            </Link>
          </li>
          <li>
            <Link href="/seller/register" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-mist hover:text-ink rounded-md text-sm transition-colors">
              <Store className="w-4 h-4 text-gray-400" />
              Sell on NovaCart
            </Link>
          </li>
          <li>
            <Link href="/support" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-mist hover:text-ink rounded-md text-sm transition-colors">
              <Headphones className="w-4 h-4 text-gray-400" />
              Customer Support
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
