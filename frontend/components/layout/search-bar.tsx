"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Camera, ChevronRight, Sparkles } from "lucide-react";
import { getSearchSuggestions } from "@/services/product-service";
import { SearchSuggestion } from "@/types";
import { ImageSearchModal } from "@/components/product/image-search-modal";

const PLACEHOLDER_PHRASES = [
  "Search for products, brands and more...",
  "Search for iPhone 15 Pro Max",
  "Search for Mobiles & Accessories",
  "Search for Laptops & Electronics",
  "Search for Shoes & Fashion",
  "Search for Smartwatches",
];

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);

  // Typewriter animation state
  const [currentText, setCurrentText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Typewriter loop
  useEffect(() => {
    if (query.length > 0) return;

    const fullPhrase = PLACEHOLDER_PHRASES[phraseIdx];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      if (currentText.length < fullPhrase.length) {
        timer = setTimeout(() => {
          setCurrentText(fullPhrase.slice(0, currentText.length + 1));
        }, 75);
      } else {
        // Pause when full phrase is typed
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 1800);
      }
    } else {
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(fullPhrase.slice(0, currentText.length - 1));
        }, 35);
      } else {
        // Move to next phrase
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % PLACEHOLDER_PHRASES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIdx, query]);

  // Debounced search suggestions
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await getSearchSuggestions(query);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        setShowSuggestions(false);
        router.push(selected.targetUrl);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      router.push(suggestions[selectedIndex].targetUrl);
    } else if (query.trim()) {
      router.push(`/products?keyword=${encodeURIComponent(query.trim())}`);
    } else {
      const activeKeyword = PLACEHOLDER_PHRASES[phraseIdx]
        .replace("Search for ", "")
        .replace("products", "");
      if (activeKeyword.trim()) {
        router.push(`/products?keyword=${encodeURIComponent(activeKeyword.trim())}`);
      } else {
        router.push("/products");
      }
    }
    setShowSuggestions(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Exact Pill Search Bar Matching User Reference Image */}
      <form
        onSubmit={handleSearchSubmit}
        onKeyDown={handleKeyDown}
        className="relative flex items-center w-full rounded-full border border-[#cbd5e1] hover:border-slate-400 focus-within:border-nova-500 focus-within:ring-2 focus-within:ring-nova-500/15 bg-white transition-all h-[48px] sm:h-[52px] px-4 sm:px-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      >
        {/* Left Search Magnifier Icon */}
        <button
          type="submit"
          aria-label="Search"
          className="text-slate-600 hover:text-nova-600 transition-colors mr-3 shrink-0 flex items-center justify-center p-0.5"
        >
          <Search className="h-5 w-5 stroke-[1.8]" />
        </button>

        {/* Input & Typing Animation Overlay */}
        <div className="relative flex-1 flex items-center min-w-0 h-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full h-full bg-transparent text-sm sm:text-base font-normal text-slate-800 outline-none pr-6 z-10"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Animated Typing Placeholder */}
          {!query && (
            <div className="pointer-events-none absolute left-0 flex items-center text-sm sm:text-base text-slate-500 font-normal select-none truncate pr-2">
              <span>{currentText}</span>
              <span className="inline-block w-[1.5px] h-4 bg-slate-400 ml-0.5 animate-pulse" />
            </div>
          )}
        </div>

        {/* Right Camera & Clear Icons (Matching Reference Image) */}
        <div className="flex items-center gap-2 shrink-0 ml-2 z-10">
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Camera Visual Search Icon on Far Right */}
          <button
            type="button"
            onClick={() => setImageSearchOpen(true)}
            title="Search by Image"
            aria-label="Search by Image"
            className="p-1 text-slate-800 hover:text-nova-600 transition-colors flex items-center justify-center"
          >
            <Camera className="h-6 w-6 stroke-[1.8]" />
          </button>
        </div>
      </form>

      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 top-full mt-2 w-full rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-slate-100">
          <div className="py-1 max-h-[65vh] overflow-y-auto">
            {suggestions.map((item, idx) => {
              const isSelected = selectedIndex === idx;

              if (item.type === "CATEGORY") {
                return (
                  <Link
                    key={`cat-${item.categorySlug}-${idx}`}
                    href={item.targetUrl}
                    onClick={() => {
                      setShowSuggestions(false);
                      setQuery("");
                    }}
                    className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                      isSelected
                        ? "bg-nova-50 text-nova-900 border-l-2 border-nova-600 pl-3.5"
                        : "hover:bg-slate-50 text-ink"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-nova-100 text-nova-700 shrink-0">
                        <Search className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-ink truncate">
                          Search for &ldquo;<span className="text-nova-600">{item.title}</span>&rdquo;
                        </p>
                        <p className="text-[11px] text-nova-600 font-medium">in {item.categoryName}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </Link>
                );
              }

              return (
                <Link
                  key={`prod-${item.id}-${idx}`}
                  href={item.targetUrl}
                  onClick={() => {
                    setShowSuggestions(false);
                    setQuery("");
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isSelected
                      ? "bg-nova-50 text-nova-900 border-l-2 border-nova-600 pl-3.5"
                      : "hover:bg-slate-50 text-ink"
                  }`}
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg border border-slate-200/70 bg-white p-0.5 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-xs sm:text-sm font-medium text-ink leading-tight">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-nova-600 font-medium truncate">
                        in {item.categoryName}
                      </span>
                      {item.brand && (
                        <>
                          <span className="text-slate-300 text-[10px]">•</span>
                          <span className="text-[11px] text-graphite truncate font-mono">
                            {item.brand}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {item.effectivePrice != null && (
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-bold text-ink">₹{item.effectivePrice}</p>
                      {item.discountPercent != null && Number(item.discountPercent) > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600">
                          {Math.round(Number(item.discountPercent))}% OFF
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 flex items-center justify-between">
            <Link
              href={`/products?keyword=${encodeURIComponent(query.trim())}`}
              onClick={() => setShowSuggestions(false)}
              className="text-xs font-bold text-nova-600 hover:text-nova-700 flex items-center gap-1"
            >
              <span>See all results for &ldquo;{query}&rdquo;</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Use ↑ ↓ keys to navigate
            </span>
          </div>
        </div>
      )}

      {/* Visual Search Modal */}
      <ImageSearchModal isOpen={imageSearchOpen} onClose={() => setImageSearchOpen(false)} />
    </div>
  );
}
