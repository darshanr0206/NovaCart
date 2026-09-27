"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

export function FlashSaleBanner() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 43,
    seconds: 17,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <section className="w-full">
      <div className="relative rounded-3xl bg-gradient-to-r from-nova-600 via-purple-600 to-indigo-600 p-6 sm:p-10 md:p-12 text-white shadow-xl overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Content */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-amber-300 text-amber-950 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                <Zap className="h-3 w-3 fill-amber-950 text-amber-950" />
                LIMITED TIME
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight font-display">
              Flash Sale — Up to 70% Off
            </h2>

            <p className="text-white/90 text-xs sm:text-sm sm:text-base font-medium">
              Thousands of deals refreshed daily across all categories
            </p>
          </div>

          {/* Right Countdown & CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-4 sm:gap-6 shrink-0">
            {/* Countdown Blocks */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl px-3 py-2 sm:px-4 sm:py-3 min-w-[56px] sm:min-w-[66px] border border-white/25 shadow-inner">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono leading-none">
                  {formatNumber(timeLeft.hours)}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">
                  HRS
                </span>
              </div>

              <span className="text-white/60 font-bold text-xl mb-3">:</span>

              <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl px-3 py-2 sm:px-4 sm:py-3 min-w-[56px] sm:min-w-[66px] border border-white/25 shadow-inner">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono leading-none">
                  {formatNumber(timeLeft.minutes)}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">
                  MIN
                </span>
              </div>

              <span className="text-white/60 font-bold text-xl mb-3">:</span>

              <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl px-3 py-2 sm:px-4 sm:py-3 min-w-[56px] sm:min-w-[66px] border border-white/25 shadow-inner">
                <span className="text-xl sm:text-2xl md:text-3xl font-black text-white font-mono leading-none">
                  {formatNumber(timeLeft.seconds)}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">
                  SEC
                </span>
              </div>
            </div>

            {/* Shop Deals Button */}
            <Link
              href="/products?minDiscount=20&sortBy=discount"
              className="inline-flex items-center gap-2 bg-white text-nova-700 hover:bg-nova-50 active:scale-95 font-bold px-6 py-3 rounded-full text-xs sm:text-sm transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <span>Shop Deals</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
