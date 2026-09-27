"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Truck,
  RefreshCcw,
  ShieldCheck,
  Tag,
  Sparkles,
  ArrowRight,
  Flame,
  Zap
} from "lucide-react";

interface HeroSlide {
  id: number;
  badge: string;
  badgeType: "hot" | "new" | "deal" | "tech";
  title: string;
  subtitle: string;
  offer: string;
  desc: string;
  image: string;
  bgGradient: string;
  textColor: string;
  buttonText: string;
  link: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    badge: "5G FLAGSHIP FEST",
    badgeType: "tech",
    title: "Next-Gen 5G Smartphones & Gear",
    subtitle: "LIGHTNING FAST PERFORMANCE",
    offer: "EXTRA ₹2,000 OFF",
    desc: "Experience high-refresh OLED displays, AI cameras & all-day battery life.",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1400&auto=format&fit=crop",
    bgGradient: "from-emerald-50 via-teal-50/50 to-green-100/60",
    textColor: "text-emerald-700",
    buttonText: "Explore 5G Mobiles",
    link: "/products?category=mobiles"
  },
  {
    id: 2,
    badge: "NEW ARRIVALS 2026",
    badgeType: "new",
    title: "Trending Styles & Premium Fashion",
    subtitle: "FRESH SEASON DROPS",
    offer: "UP TO 60% OFF",
    desc: "Explore latest trendsetter kurtas, denim, shirts & dresses with instant savings.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop",
    bgGradient: "from-rose-50 via-amber-50/40 to-orange-50",
    textColor: "text-rose-600",
    buttonText: "Shop Fashion Deals",
    link: "/products?category=fashion"
  },
  {
    id: 3,
    badge: "AUDIO & SMART DEVICES",
    badgeType: "hot",
    title: "Noise-Cancelling Audio & Smartwatches",
    subtitle: "IMMERSIVE ACOUSTICS",
    offer: "STARTING AT ₹999",
    desc: "Wireless earbuds, premium soundbars, and smart fitness trackers.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop",
    bgGradient: "from-slate-100 via-indigo-50/30 to-purple-50",
    textColor: "text-indigo-600",
    buttonText: "Browse Electronics",
    link: "/products?category=electronics"
  },
  {
    id: 4,
    badge: "FRESH SNEAKER DROP",
    badgeType: "new",
    title: "Step Up with Performance Footwear",
    subtitle: "COMFORT & STREET STYLE",
    offer: "MIN. 45% DISCOUNT",
    desc: "Engineered running shoes, casual lifestyle sneakers, and formal shoes.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1400&auto=format&fit=crop",
    bgGradient: "from-amber-50 via-orange-50/40 to-red-50",
    textColor: "text-amber-700",
    buttonText: "Shop Shoes Collection",
    link: "/products?category=shoes"
  },
  {
    id: 5,
    badge: "HOME & KITCHEN MAKEOVER",
    badgeType: "deal",
    title: "Modern Cookware & Aesthetic Decor",
    subtitle: "ELEVATE YOUR SPACE",
    offer: "FLAT 50% OFF",
    desc: "Non-stick granite cookware, air fryers, wall art & luxury bedsheets.",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1400&auto=format&fit=crop",
    bgGradient: "from-amber-50 via-yellow-50/40 to-stone-50",
    textColor: "text-amber-700",
    buttonText: "Explore Home & Kitchen",
    link: "/products?category=home-kitchen"
  },
  {
    id: 6,
    badge: "LUXE BEAUTY SPOTLIGHT",
    badgeType: "hot",
    title: "Glow Up with Authentic Skincare & Makeup",
    subtitle: "100% DERMA CERTIFIED",
    offer: "BUY 1 GET 1 OFFERS",
    desc: "Top beauty essentials, hydrating serums, lipsticks & fragrances.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1400&auto=format&fit=crop",
    bgGradient: "from-purple-50 via-pink-50/40 to-rose-50",
    textColor: "text-fuchsia-600",
    buttonText: "Shop Beauty Deals",
    link: "/products?category=beauty"
  }
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch swipe gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const minSwipeDistance = 40;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));

  // Touch event handlers for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) {
      nextSlide(); // swiped left -> show next
    } else if (distance < -minSwipeDistance) {
      prevSlide(); // swiped right -> show previous
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Mouse drag handlers for desktop/testing swiping
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPaused(true);
    isDragging.current = true;
    mouseStartX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPaused(false);
    if (!isDragging.current || mouseStartX.current === null) return;
    isDragging.current = false;
    const distance = mouseStartX.current - e.clientX;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    mouseStartX.current = null;
  };

  return (
    <div className="flex flex-col gap-3 w-full select-none">
      {/* Sliding Banner - swipeable, auto-sliding, arrows removed */}
      <div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-[210px] sm:h-[320px] md:h-[360px] w-full shadow-xs border border-line cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Slides Track */}
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_SLIDES.map((slide) => (
            <div
              key={slide.id}
              className={`w-full h-full flex-shrink-0 flex items-center p-4 sm:p-10 md:px-14 bg-gradient-to-r ${slide.bgGradient} relative overflow-hidden`}
            >
              {/* Left Content Area */}
              <div className="z-10 w-[62%] sm:w-3/5 space-y-1.5 sm:space-y-3">
                {/* Badges Row */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-extrabold tracking-wider uppercase px-2 sm:px-2.5 py-0.5 rounded-full bg-white shadow-xs border border-line/60 text-ink">
                    {slide.badgeType === "hot" && <Flame className="h-3 w-3 text-rose-500" />}
                    {slide.badgeType === "tech" && <Zap className="h-3 w-3 text-blue-500" />}
                    {slide.badgeType === "new" && <Sparkles className="h-3 w-3 text-amber-500" />}
                    {slide.badgeType === "deal" && <Tag className="h-3 w-3 text-emerald-500" />}
                    <span>{slide.badge}</span>
                  </span>

                  <span className="text-[9px] sm:text-[11px] font-black tracking-wider px-2 py-0.5 rounded-full bg-ink text-white shadow-xs">
                    {slide.offer}
                  </span>
                </div>

                {/* Subtitle */}
                <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${slide.textColor}`}>
                  {slide.subtitle}
                </p>

                {/* Headline */}
                <h1 className="text-base sm:text-2xl md:text-3xl font-black text-ink leading-tight tracking-tight max-w-lg line-clamp-2">
                  {slide.title}
                </h1>

                {/* Description - hidden on tiny mobile, visible sm+ */}
                <p className="text-xs text-slate-600 max-w-md hidden sm:block line-clamp-2">
                  {slide.desc}
                </p>

                {/* Call to Action Button */}
                <div className="pt-0.5 sm:pt-1">
                  <Link
                    href={slide.link}
                    className="inline-flex items-center gap-1.5 bg-ink text-white px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs hover:bg-nova-600 transition-colors shadow-xs"
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Hero Product Image - visible on mobile & desktop */}
              <div className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 h-[82%] sm:h-[88%] w-[36%] sm:w-[40%] flex items-center justify-center pointer-events-none">
                <div className="relative h-full w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-xs">
                  <img
                    src={slide.image}
                    className="h-full w-full object-cover object-center"
                    alt={slide.title}
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Indicator Pills matching reference image */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentSlide === idx ? "w-8 bg-ink" : "w-2.5 bg-slate-300 hover:bg-slate-400"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Benefit Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-b border-line px-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-line/60">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink">Free Delivery</h4>
            <p className="text-[11px] text-graphite hidden sm:block">On orders above ₹499</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-line/60">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink">7-Day Easy Returns</h4>
            <p className="text-[11px] text-graphite hidden sm:block">Instant refund to source</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-line/60">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink">Razorpay Secure</h4>
            <p className="text-[11px] text-graphite hidden sm:block">100% encrypted checkout</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-line/60">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-ink">Best Price Promise</h4>
            <p className="text-[11px] text-graphite hidden sm:block">Direct from certified sellers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
