"use client";

import { useState } from "react";
import { Star, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { toast } from "sonner";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const mainImage = images[selected] ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200";

  const prev = () => setSelected((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setSelected((i) => (i === images.length - 1 ? 0 : i + 1));

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted((prev) => {
      const next = !prev;
      if (next) {
        toast.success(`Added "${productName.slice(0, 30)}..." to wishlist!`);
      } else {
        toast.info(`Removed "${productName.slice(0, 30)}..." from wishlist`);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-mist group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainImage}
          alt={`${productName} — view ${selected + 1}`}
          className="h-full w-full object-contain transition duration-300"
        />
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 text-gray-400 hover:text-red-500 shadow-sm transition-colors"
        >
          <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 shadow hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5 text-ink" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 shadow hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5 text-ink" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`h-16 w-16 overflow-hidden rounded border-2 transition-colors ${
                selected === i ? "border-nova-500" : "border-line hover:border-nova-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Thumbnail ${i + 1}`} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Star rating display ───────────────────────────────────────────────────────
export function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 bg-green-600 text-white text-sm font-bold px-2 py-0.5 rounded">
        <span>{rating.toFixed(1)}</span>
        <Star className="h-3.5 w-3.5 fill-white" />
      </div>
      <span className="text-sm text-graphite">{count.toLocaleString("en-IN")} ratings & reviews</span>
    </div>
  );
}
