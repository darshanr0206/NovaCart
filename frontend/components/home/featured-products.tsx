"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Heart, ShoppingBag, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { addToCart } from "@/services/cart-service";
import { formatINR } from "@/lib/utils";

interface FeaturedItem {
  id: number;
  name: string;
  seller: string;
  price: number;
  originalPrice: number;
  discount: string;
  rating: number;
  reviews: number;
  image: string;
  badge: {
    text: string;
    bg: string;
    textCol: string;
  };
}

const FEATURED_PRODUCTS: FeaturedItem[] = [
  {
    id: 39501,
    name: "ProBook Ultra 15",
    seller: "TechVolt Store",
    price: 89999,
    originalPrice: 120000,
    discount: "25% off",
    rating: 5.0,
    reviews: 2143,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop",
    badge: { text: "Best Seller", bg: "bg-amber-400", textCol: "text-amber-950" },
  },
  {
    id: 39503,
    name: "Nova SoundMax Pro",
    seller: "AudioNord",
    price: 12499,
    originalPrice: 18000,
    discount: "30% off",
    rating: 5.0,
    reviews: 1892,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    badge: { text: "30% Off", bg: "bg-rose-500", textCol: "text-white" },
  },
  {
    id: 39504,
    name: "Velocity X Runner",
    seller: "SportsPeak",
    price: 7499,
    originalPrice: 11000,
    discount: "32% off",
    rating: 5.0,
    reviews: 3254,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
    badge: { text: "Top Rated", bg: "bg-emerald-500", textCol: "text-white" },
  },
  {
    id: 39505,
    name: "Lumen Desk Lamp S3",
    seller: "NovaZen",
    price: 3299,
    originalPrice: 4999,
    discount: "34% off",
    rating: 5.0,
    reviews: 981,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
    badge: { text: "New", bg: "bg-nova-600", textCol: "text-white" },
  },
  {
    id: 39506,
    name: "NovaCam X1 Mirrorless",
    seller: "PixelPro Shop",
    price: 54999,
    originalPrice: 76000,
    discount: "27% off",
    rating: 5.0,
    reviews: 612,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop",
    badge: { text: "Premium", bg: "bg-indigo-600", textCol: "text-white" },
  },
  {
    id: 39507,
    name: "AeroFit Smart Watch",
    seller: "AtlasTech",
    price: 18999,
    originalPrice: 26000,
    discount: "27% off",
    rating: 5.0,
    reviews: 4120,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
    badge: { text: "27% Off", bg: "bg-rose-500", textCol: "text-white" },
  },
  {
    id: 39508,
    name: "Heritage Linen Blazer",
    seller: "Drops & Co.",
    price: 5499,
    originalPrice: 8200,
    discount: "33% off",
    rating: 5.0,
    reviews: 785,
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=800&auto=format&fit=crop",
    badge: { text: "Style Pick", bg: "bg-amber-500", textCol: "text-white" },
  },
  {
    id: 39509,
    name: "Velour Cloud Sofa",
    seller: "FurnishHome",
    price: 42000,
    originalPrice: 68000,
    discount: "38% off",
    rating: 5.0,
    reviews: 423,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop",
    badge: { text: "Editor's Pick", bg: "bg-purple-700", textCol: "text-white" },
  },
];

export function FeaturedProducts() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setCart, addLocalItem } = useCartStore();
  const [wishlist, setWishlist] = useState<Record<number, boolean>>({});
  const [addingId, setAddingId] = useState<number | null>(null);

  const toggleWishlist = (id: number, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => {
      const next = !prev[id];
      if (next) {
        toast.success(`Saved "${name}" to Wishlist!`);
      } else {
        toast.info(`Removed "${name}" from Wishlist`);
      }
      return { ...prev, [id]: next };
    });
  };

  const handleAddToCart = async (item: FeaturedItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAddingId(item.id);
    try {
      if (user) {
        const cart = await addToCart(item.id, 1);
        setCart(cart);
      } else {
        addLocalItem({
          productId: item.id,
          productName: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
        });
      }
      toast.success(`Added "${item.name}" to cart!`);
    } catch {
      addLocalItem({
        productId: item.id,
        productName: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
      });
      toast.success(`Added "${item.name}" to cart!`);
    } finally {
      setTimeout(() => setAddingId(null), 600);
    }
  };

  return (
    <section className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-end justify-between px-1">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-nova-600 block mb-0.5">
            CURATED FOR YOU
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink font-display tracking-tight">
            Featured Products
          </h2>
        </div>
        <Link
          href="/products"
          className="text-xs sm:text-sm font-semibold text-nova-600 hover:text-nova-700 flex items-center gap-1 transition-colors group"
        >
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Responsive Grid matching mobile 2-column aesthetic */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {FEATURED_PRODUCTS.map((item) => {
          const isWishlisted = !!wishlist[item.id];
          const isAdding = addingId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => router.push(`/products/${item.id}`)}
              className="bg-white rounded-2xl border border-slate-100/90 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer relative"
            >
              {/* Top Row: Badge on left, Wishlist on right */}
              <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
                <span
                  className={`inline-block ${item.badge.bg} ${item.badge.textCol} text-[10px] sm:text-[11px] font-extrabold px-1.5 py-0.5 rounded shadow-xs pointer-events-auto`}
                >
                  {item.badge.text}
                </span>

                <button
                  type="button"
                  onClick={(e) => toggleWishlist(item.id, item.name, e)}
                  aria-label="Add to wishlist"
                  className="pointer-events-auto h-7 w-7 rounded-full bg-white/70 backdrop-blur-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-transform active:scale-90"
                >
                  <Heart
                    className={`h-4 w-4 stroke-[1.8] ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`}
                  />
                </button>
              </div>

              {/* Image Container */}
              <div className="relative aspect-square w-full bg-white flex items-center justify-center p-3 pt-6 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Card Body */}
              <div className="p-2.5 sm:p-3 flex flex-col flex-1 gap-1">
                {/* Seller Label */}
                <span className="text-[10px] sm:text-[11px] font-bold text-[#6938ef] uppercase tracking-wider truncate block">
                  {item.seller}
                </span>

                {/* Product Name */}
                <h3 className="text-xs sm:text-[13px] font-medium text-slate-900 group-hover:text-[#6938ef] transition-colors line-clamp-2 leading-snug min-h-[2.3rem]">
                  {item.name}
                </h3>

                {/* Rating Badge */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-900 border border-amber-200/60 px-1 py-0.5 rounded text-[10px] font-bold shrink-0">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-400 text-[10px] sm:text-[11px] font-normal truncate">
                    ({item.reviews.toLocaleString("en-IN")})
                  </span>
                </div>

                {/* Price Row */}
                <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900">
                    {formatINR(item.price)}
                  </span>
                  <span className="text-[11px] text-slate-400 line-through">
                    {formatINR(item.originalPrice)}
                  </span>
                </div>

                {/* Discount Line */}
                <span className="text-[11px] font-bold text-emerald-600 -mt-0.5">
                  {item.discount}
                </span>

                {/* Add to Cart Button */}
                <div className="mt-auto pt-2">
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(item, e)}
                    disabled={isAdding}
                    className="w-full bg-[#6938ef] hover:bg-[#5b2ee0] active:scale-[0.98] text-white font-semibold py-2 px-2.5 rounded-lg text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-80"
                  >
                    {isAdding ? (
                      <>
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
