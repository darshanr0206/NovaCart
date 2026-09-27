"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Smartphone,
  Laptop,
  Shirt,
  Armchair,
  Sparkles,
  ShoppingCart,
  Dumbbell,
} from "lucide-react";

interface CategoryShortcut {
  id: string;
  name: string;
  href: string;
  icon: "grid" | "mobile" | "laptop" | "shirt" | "home" | "beauty" | "grocery" | "sports";
}

const SHORTCUTS: CategoryShortcut[] = [
  { id: "all", name: "All", href: "/products", icon: "grid" },
  { id: "mobiles", name: "Mobiles", href: "/products?categorySlug=flagship-mobiles", icon: "mobile" },
  { id: "electronics", name: "Electronics", href: "/products?categorySlug=laptops-desktops", icon: "laptop" },
  { id: "fashion", name: "Fashion", href: "/products?categorySlug=men-casual-wear", icon: "shirt" },
  { id: "home", name: "Home", href: "/products?categorySlug=sofas-recliners", icon: "home" },
  { id: "beauty", name: "Beauty", href: "/products?categorySlug=skincare", icon: "beauty" },
  { id: "grocery", name: "Grocery", href: "/products?categorySlug=groceries", icon: "grocery" },
  { id: "sports", name: "Sports", href: "/products?categorySlug=gym-fitness", icon: "sports" },
];

export function CategoryShortcuts({
  activeId = "all",
  onSelect,
}: {
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  const [selected, setSelected] = useState(activeId);

  const handleClick = (cat: CategoryShortcut, e: React.MouseEvent) => {
    setSelected(cat.id);
    if (onSelect) {
      onSelect(cat.id);
    }
  };

  const renderIcon = (iconType: CategoryShortcut["icon"], isActive: boolean) => {
    const iconColor = isActive ? "text-[#6938ef]" : "text-slate-700";
    switch (iconType) {
      case "grid":
        return <LayoutGrid className={`w-5 h-5 ${iconColor}`} strokeWidth={2.2} />;
      case "mobile":
        return <Smartphone className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />;
      case "laptop":
        return <Laptop className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />;
      case "shirt":
        return <Shirt className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />;
      case "home":
        return (
          <svg viewBox="0 0 24 24" className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
            <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
            <path d="M4 18v2" />
            <path d="M20 18v2" />
            <path d="M9 13v2" />
            <path d="M15 13v2" />
          </svg>
        );
      case "beauty":
        return (
          <svg viewBox="0 0 24 24" className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2h4v3h-4z" />
            <path d="M9 5h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
          </svg>
        );
      case "grocery":
        return <ShoppingCart className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />;
      case "sports":
        return (
          <svg viewBox="0 0 24 24" className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M4.93 4.93c4.24 4.24 4.24 11.1 0 15.34" />
            <path d="M19.07 4.93c-4.24 4.24-4.24 11.1 0 15.34" />
            <path d="M2 12h20" />
          </svg>
        );
      default:
        return <Sparkles className={`w-5 h-5 ${iconColor}`} />;
    }
  };

  return (
    <div className="w-full overflow-x-auto hide-scrollbar scroll-smooth py-1 -mx-3.5 px-3.5 sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-3 min-w-max pb-0.5">
        {SHORTCUTS.map((cat) => {
          const isActive = selected === cat.id;

          return (
            <Link
              key={cat.id}
              href={cat.href}
              onClick={(e) => handleClick(cat, e)}
              className="flex flex-col items-center gap-1.5 group select-none transition-transform active:scale-95"
            >
              {/* Squircle Icon Container */}
              <div
                className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-[#EDE9FE] shadow-[0_2px_8px_rgba(105,56,239,0.15)] ring-1 ring-[#6938ef]/30"
                    : "bg-[#F8FAFC] border border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                }`}
              >
                {renderIcon(cat.icon, isActive)}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] tracking-tight transition-colors ${
                  isActive
                    ? "text-[#6938ef] font-bold"
                    : "text-slate-600 font-medium group-hover:text-slate-900"
                }`}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
