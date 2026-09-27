"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./product-card";
import { Product } from "@/types";

interface ProductCarouselProps {
  products: Product[];
  emptyMessage?: string;
}

export function ProductCarousel({ products, emptyMessage }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = direction === "left" ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!products || products.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { current } = scrollContainerRef;
        const maxScroll = current.scrollWidth - current.clientWidth;
        
        // If we've reached the end, scroll back to start, else scroll right
        if (current.scrollLeft >= maxScroll - 10) {
          current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          current.scrollBy({ left: 300, behavior: "smooth" });
        }
      }
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(interval);
  }, [products, isPaused]);

  if (!products || products.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <p className="text-sm text-gray-500">{emptyMessage ?? "No products found."}</p>
      </div>
    );
  }

  return (
    <div 
      className="relative group px-2 md:px-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Left Arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 opacity-0 transition-opacity hover:bg-gray-50 hover:text-blue-600 group-hover:opacity-100 hidden md:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 px-2 md:px-8"
      >
        {products.map((product) => (
          <div key={product.id} className="snap-start shrink-0 w-[180px] sm:w-[200px] md:w-[220px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 opacity-0 transition-opacity hover:bg-gray-50 hover:text-blue-600 group-hover:opacity-100 hidden md:flex"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
