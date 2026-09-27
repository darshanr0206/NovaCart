import Link from "next/link";

interface CategoryItem {
  name: string;
  emoji: string;
  slug: string;
  image?: string;
}

const CATEGORIES: CategoryItem[] = [
  { name: "Groceries", emoji: "🛒", slug: "groceries-household" },
  { name: "Mobiles", emoji: "📱", image: "/images/mobile-phone.png", slug: "mobiles" },
  { name: "Electronics", emoji: "💻", slug: "electronics" },
  { name: "Fashion", emoji: "👕", slug: "fashion" },
  { name: "Shoes", emoji: "👟", slug: "shoes-footwear" },
  { name: "Books", emoji: "📚", slug: "books-stationery" },
  { name: "Home & Kitchen", emoji: "🍳", slug: "home-kitchen" },
  { name: "Beauty", emoji: "💄", slug: "beauty-personal-care" },
  { name: "Furniture", emoji: "🛋️", slug: "furniture-home-decor" },
  { name: "Toys & Kids", emoji: "🧸", slug: "toys-kids" },
  { name: "Sports", emoji: "⚽", slug: "sports-fitness" },
];

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/products?category=${cat.slug}`}
          className="card flex flex-col items-center gap-2 p-4 text-center hover:border-nova-300 hover:shadow-sm transition-all group"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-nova-50 text-2xl overflow-hidden p-1.5 group-hover:scale-110 transition duration-200">
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                className="h-full w-full object-contain drop-shadow-sm"
              />
            ) : (
              cat.emoji
            )}
          </span>
          <span className="text-xs font-medium text-ink leading-tight">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
