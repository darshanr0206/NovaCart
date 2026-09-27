"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Award, Truck } from "lucide-react";

interface BannerSlide {
  id: number;
  tagline: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  accentColor: string; // tagline & CTA colour
  bgFrom: string;
  bgVia: string;
  bgTo: string;
}

// ── 10 slides built from existing NovaCart categories / product types ──────────
const SLIDES: BannerSlide[] = [
  {
    id: 1,
    tagline: "NEW ARRIVALS",
    title: "Upgrade\nYour Everyday",
    subtitle: "Top brands. Best deals. Only on NovaCart.",
    ctaText: "Shop Now",
    ctaLink: "/new-arrivals",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#EEF2FF",
    bgVia: "#F3E8FF",
    bgTo: "#FAF5FF",
  },
  {
    id: 2,
    tagline: "FLAGSHIP MOBILES",
    title: "Smartphones\n& Gadgets",
    subtitle: "Next-gen flagships from top brands at the best prices.",
    ctaText: "Explore Phones",
    ctaLink: "/products?categorySlug=flagship-mobiles",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#EEF2FF",
    bgVia: "#EDE9FE",
    bgTo: "#F5F3FF",
  },
  {
    id: 3,
    tagline: "FASHION SALE",
    title: "Trending\nFashion Fits",
    subtitle: "Premium streetwear, shirts, shoes & hoodies.",
    ctaText: "Shop Fashion",
    ctaLink: "/products?categorySlug=men-casual-wear",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#F5F3FF",
    bgVia: "#EDE9FE",
    bgTo: "#EEF2FF",
  },
  {
    id: 4,
    tagline: "LAPTOPS & DESKTOPS",
    title: "Power Up\nYour Work",
    subtitle: "High-performance laptops & PCs from top brands.",
    ctaText: "Shop Laptops",
    ctaLink: "/products?categorySlug=laptops-desktops",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#EFF6FF",
    bgVia: "#EDE9FE",
    bgTo: "#F5F3FF",
  },
  {
    id: 5,
    tagline: "HOME & KITCHEN",
    title: "Smart Living\nEssentials",
    subtitle: "Air fryers, blenders & smart kitchen tech.",
    ctaText: "Shop Living",
    ctaLink: "/products?categorySlug=home-kitchen",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#F0FDF4",
    bgVia: "#DCFCE7",
    bgTo: "#F5F3FF",
  },
  {
    id: 6,
    tagline: "AUDIO & WEARABLES",
    title: "Sound That\nMoves You",
    subtitle: "Earbuds, headphones & smartwatches at unbeatable prices.",
    ctaText: "Explore Audio",
    ctaLink: "/products?categorySlug=earbuds-headphones",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#FFF7ED",
    bgVia: "#FEF3C7",
    bgTo: "#F5F3FF",
  },
  {
    id: 7,
    tagline: "BEAUTY & SKINCARE",
    title: "Glow Up\nEvery Day",
    subtitle: "Top skincare, grooming & wellness products.",
    ctaText: "Shop Beauty",
    ctaLink: "/products?categorySlug=skincare",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#FDF2F8",
    bgVia: "#FCE7F3",
    bgTo: "#F5F3FF",
  },
  {
    id: 8,
    tagline: "SPORTS & FITNESS",
    title: "Train Hard,\nLive Strong",
    subtitle: "Gym equipment, sportswear & fitness accessories.",
    ctaText: "Shop Sports",
    ctaLink: "/products?categorySlug=gym-fitness",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#ECFDF5",
    bgVia: "#D1FAE5",
    bgTo: "#F5F3FF",
  },
  {
    id: 9,
    tagline: "FLASH DEALS",
    title: "Up to 70%\nOff Today",
    subtitle: "Thousands of deals refreshed daily across all categories.",
    ctaText: "See All Deals",
    ctaLink: "/deals",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#FFF1F2",
    bgVia: "#FFE4E6",
    bgTo: "#F5F3FF",
  },
  {
    id: 10,
    tagline: "GROCERY & DAILY NEEDS",
    title: "Fresh Picks\nDelivered Fast",
    subtitle: "Groceries, snacks & household essentials at your door.",
    ctaText: "Shop Grocery",
    ctaLink: "/products?categorySlug=groceries",
    image: "/images/banner_upgrade_world.jpg",
    accentColor: "#6938ef",
    bgFrom: "#F0FDF4",
    bgVia: "#DCFCE7",
    bgTo: "#ECFDF5",
  },
];

const BENEFITS = [
  { icon: Award, label: "Best Brands" },
  { icon: Zap, label: "Great Prices" },
  { icon: Truck, label: "Fast Delivery" },
];

const SLIDE_INTERVAL_MS = 4500;

export function CompactHeroBanner() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Go to a specific slide (with transition guard) ──────────────────────────
  const goTo = useCallback((idx: number) => {
    setCurrentIdx(idx);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // ── Auto-advance ────────────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(goNext, SLIDE_INTERVAL_MS);
  }, [goNext]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  // ── Touch / Swipe support ───────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Only handle horizontal swipes (ignore vertical scrolls)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
      resetTimer();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleDotClick = (idx: number) => {
    goTo(idx);
    resetTimer();
  };

  const slide = SLIDES[currentIdx];

  return (
    <div className="w-full space-y-2.5">
      {/* ── Banner viewport (clips the sliding track) ── */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden select-none"
        style={{
          background: `linear-gradient(to right, ${slide.bgFrom}, ${slide.bgVia}, ${slide.bgTo})`,
          transition: "background 0.6s ease",
          minHeight: "170px",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Sliding track: all slides side-by-side ── */}
        <div
          className="flex w-full"
          style={{
            transform: `translateX(-${currentIdx * 100}%)`,
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              className="relative shrink-0 w-full flex items-center"
              style={{
                minHeight: "170px",
                background: `linear-gradient(to right, ${s.bgFrom}, ${s.bgVia}, ${s.bgTo})`,
              }}
              aria-hidden={i !== currentIdx}
            >
              {/* Right-side product image */}
              <div className="absolute right-0 top-0 bottom-0 w-[52%] overflow-hidden pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  className="w-full h-full object-cover object-right"
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
                {/* Blend fade */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, ${s.bgFrom} 0%, ${s.bgFrom}88 30%, transparent 70%)`,
                  }}
                />
              </div>

              {/* Benefit pill badges — desktop only */}
              <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex flex-col gap-1.5 pointer-events-none">
                {BENEFITS.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm border border-white/60"
                  >
                    <Icon className="h-3 w-3 shrink-0" style={{ color: s.accentColor }} strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-slate-800 whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>

              {/* Left-side content */}
              <div className="relative z-10 p-4 sm:p-6 md:p-8 max-w-[58%] sm:max-w-[50%] flex flex-col justify-center gap-0">
                {/* Tagline */}
                <span
                  className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-widest mb-1.5 block"
                  style={{ color: s.accentColor }}
                >
                  {s.tagline}
                </span>

                {/* Headline */}
                <h2 className="text-[22px] sm:text-2xl md:text-[28px] font-black text-slate-900 leading-[1.12] tracking-tight mb-1.5 whitespace-pre-line font-display">
                  {s.title}
                </h2>

                {/* Subtitle */}
                <p className="text-[10.5px] sm:text-xs text-slate-600 font-normal leading-snug line-clamp-2 mb-3 sm:mb-4">
                  {s.subtitle}
                </p>

                {/* CTA button */}
                <div>
                  <Link
                    href={s.ctaLink}
                    className="inline-flex items-center gap-1.5 text-white text-[11px] sm:text-xs font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-sm transition-all active:scale-95 hover:opacity-90"
                    style={{ backgroundColor: s.accentColor }}
                  >
                    <span>{s.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pagination dots ── */}
      <div className="flex items-center justify-center gap-1.5">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleDotClick(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className="rounded-full transition-all duration-300 focus:outline-none"
            style={{
              width: idx === currentIdx ? "18px" : "6px",
              height: "6px",
              backgroundColor: idx === currentIdx ? "#6938ef" : "#CBD5E1",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
