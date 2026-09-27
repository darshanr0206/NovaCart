"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, MapPin, Heart, ShoppingBag, Bell, User, Store, Menu, ChevronDown, ChevronRight, X, SlidersHorizontal, ArrowLeft, Camera, Sparkles, CornerDownLeft, ArrowUpRight, Home, LayoutGrid, Check, List, Package } from "lucide-react";
import { Logo } from "./logo";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { getCart } from "@/services/cart-service";
import { SearchSuggestion } from "@/types";
import { getSearchSuggestions } from "@/services/product-service";
import { ImageSearchModal } from "@/components/product/image-search-modal";
import { SearchBar } from "./search-bar";

import { CANONICAL_CATEGORIES } from "@/lib/categories";

// ─── 11 Canonical NovaCart Categories ───────
const MEGA_MENU_CATEGORIES = CANONICAL_CATEGORIES;

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrate, hydrated } = useAuthStore();
  const { cart, setCart, itemCount, hydrated: cartHydrated } = useCartStore();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; slug: string | null }>({
    name: "All Categories",
    slug: null,
  });
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && user) {
      getCart()
        .then((serverCart) => {
          const localCart = useCartStore.getState().cart;
          if (serverCart.items && serverCart.items.length > 0) {
            setCart(serverCart);
          } else if (!localCart || !localCart.items || localCart.items.length === 0) {
            setCart(serverCart);
          }
        })
        .catch(() => { });
    }
  }, [hydrated, user, setCart]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const timer = setTimeout(() => {
        getSearchSuggestions(query, 7)
          .then((data) => {
            setSuggestions(data);
            setShowSuggestions(data.length > 0);
            setSelectedIndex(-1);
          })
          .catch(() => {
            setSuggestions([]);
          });
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [query]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
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
      if (selectedCategory.slug) {
        router.push(`/products?categorySlug=${selectedCategory.slug}&keyword=${encodeURIComponent(query.trim())}`);
      } else {
        router.push(`/products?keyword=${encodeURIComponent(query.trim())}`);
      }
    } else if (selectedCategory.slug) {
      router.push(`/products?categorySlug=${selectedCategory.slug}`);
    }
    setShowSuggestions(false);
    setCategoryDropdownOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-md">
        {/* Mobile Top Header (Exact Match to User Reference: Logo on left, Heart + Bag + Menu on right) */}
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:hidden">
          <Logo />

          <div className="flex items-center gap-5 text-slate-800">
            {/* 1. Wishlist */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="p-1 hover:text-nova-600 transition-colors text-slate-800"
            >
              <Heart className="h-6 w-6 stroke-[1.8]" />
            </Link>

            {/* 2. Cart */}
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative p-1 hover:text-nova-600 transition-colors text-slate-800"
            >
              <ShoppingBag className="h-6 w-6 stroke-[1.8]" />
              {cartHydrated && itemCount() > 0 && (
                <span className="absolute -top-1 -right-1.5 grid h-4 w-4 place-items-center rounded-full bg-nova-600 text-[9px] font-bold text-white shadow-xs">
                  {itemCount()}
                </span>
              )}
            </Link>

            {/* 3. Hamburger Menu */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="p-1 hover:text-nova-600 transition-colors text-slate-800"
            >
              <Menu className="h-6 w-6 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Hidden completely on Categories page) */}
        {!pathname.startsWith("/categories") && (
          <div className="md:hidden px-4 pb-3 pt-0.5 bg-white">
            <SearchBar />
          </div>
        )}

        {/* Desktop Header */}
        <div className="container-content hidden h-16 items-center gap-6 md:flex">
          <Logo />

          {/* Desktop Search Bar (Hidden on Categories page) */}
          <div className="flex-1 max-w-2xl lg:max-w-3xl mx-auto">
            {!pathname.startsWith("/categories") && <SearchBar />}
          </div>

          {/* Location pill */}
          <button className="hidden items-center gap-1 text-sm text-graphite hover:text-ink lg:flex shrink-0">
            <MapPin className="h-4 w-4" />
            Bengaluru
          </button>

          {/* Become a seller */}
          <nav className="hidden items-center gap-2 text-xs shrink-0 lg:flex">
            {user?.roles.includes("SELLER") ? (
              <Link href="/seller" className="rounded-full px-2 py-1 text-graphite hover:text-ink">
                Seller dashboard
              </Link>
            ) : (
              <Link href="/seller/register" className="flex items-center gap-1 rounded-full px-2 py-1 text-graphite hover:text-ink">
                <Store className="h-4 w-4" /> Become a Seller
              </Link>
            )}
          </nav>

          {/* Desktop Right Icons */}
          <div className="ml-auto flex items-center gap-4">
            <Link href="/wishlist" aria-label="Wishlist" className="text-graphite hover:text-ink p-1">
              <Heart className="h-5 w-5 stroke-[1.8]" />
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative text-graphite hover:text-ink p-1">
              <ShoppingBag className="h-5 w-5 stroke-[1.8]" />
              {cartHydrated && itemCount() > 0 && (
                <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-nova-600 text-[10px] font-medium text-white shadow-xs">
                  {itemCount()}
                </span>
              )}
            </Link>
            <Link
              href={hydrated && user ? "/account" : "/login"}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs sm:text-sm text-ink hover:border-ink transition-colors"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>
                {hydrated && user
                  ? (user.fullName ? user.fullName.split(" ")[0] : (user.phone || "Account"))
                  : "Login"}
              </span>
            </Link>
          </div>
        </div>

        {/* Sub-nav bar — All Categories + nav links */}
        <div className="container-content hidden gap-8 border-t border-line py-2 text-[13px] font-medium text-ink md:flex">
          <div
            className="flex cursor-pointer items-center gap-1.5 hover:text-nova-600"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-4 w-4" />
            <span>All Categories</span>
          </div>
          <Link href="/new-arrivals" className="hover:text-nova-600 flex items-center gap-1 transition-colors">
            <Sparkles className="h-3.5 w-3.5 text-[#5C1BFD]" />
            <span className="font-semibold">New Arrivals</span>
          </Link>
          <Link href="/deals" className="hover:text-nova-600 flex items-center gap-1 transition-colors">
            <span>Deals & Offers</span>
          </Link>
        </div>
      </header>

      {/* Amazon-style Categories Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => {
              setDrawerOpen(false);
              setActiveSubmenu(null);
            }}
          />

          {/* Close button next to drawer (desktop only) */}
          <button
            onClick={() => {
              setDrawerOpen(false);
              setActiveSubmenu(null);
            }}
            className="absolute left-[365px] top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 hidden md:flex"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Drawer Sidebar Container */}
          <div
            className="relative flex h-full w-[350px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out"
          >
            {/* Header: User Sign-in/Welcome banner */}
            <div className="flex items-center justify-between bg-ink px-5 py-4 text-white shrink-0">
              <Link
                href={hydrated && user ? "/profile" : "/login"}
                onClick={() => {
                  setDrawerOpen(false);
                  setActiveSubmenu(null);
                }}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white border border-white/20 shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs text-slate-300">Hello,</p>
                  <p className="text-sm sm:text-base font-bold truncate">
                    {hydrated && user ? user.fullName : "Sign In / Register"}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setActiveSubmenu(null);
                }}
                className="text-white/80 hover:text-white md:hidden p-1 shrink-0 ml-2"
                aria-label="Close drawer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Slider panel content */}
            <div className="relative flex-1 overflow-hidden">
              {/* Main Category Menu Panel */}
              <div
                className={`absolute inset-0 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${activeSubmenu ? "-translate-x-full" : "translate-x-0"
                  }`}
              >
                {/* Shop by Category Section */}
                <div className="border-b border-line py-4">
                  <h3 className="px-6 text-xs font-bold text-graphite uppercase tracking-wider mb-2">
                    Shop by Category
                  </h3>
                  <div className="space-y-0.5">
                    {MEGA_MENU_CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => setActiveSubmenu(cat.slug)}
                        className="flex w-full items-center justify-between px-6 py-3 text-left text-[14px] text-ink hover:bg-mist transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{cat.emoji}</span>
                          <span>{cat.name}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-ink transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Programs & Features Section */}
                <div className="border-b border-line py-4">
                  <h3 className="px-6 text-xs font-bold text-graphite uppercase tracking-wider mb-2">
                    Programs & Features
                  </h3>
                  <div className="space-y-0.5">
                    <Link
                      href="/products"
                      onClick={() => setDrawerOpen(false)}
                      className="flex w-full items-center px-6 py-3 text-[14px] text-ink hover:bg-mist transition-colors"
                    >
                      All Products
                    </Link>
                    {user?.roles.includes("SELLER") ? (
                      <Link
                        href="/seller"
                        onClick={() => setDrawerOpen(false)}
                        className="flex w-full items-center px-6 py-3 text-[14px] text-ink hover:bg-mist transition-colors"
                      >
                        Seller Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/seller/register"
                        onClick={() => setDrawerOpen(false)}
                        className="flex w-full items-center px-6 py-3 text-[14px] text-ink hover:bg-mist transition-colors"
                      >
                        Become a Seller
                      </Link>
                    )}
                    <Link
                      href="/orders"
                      onClick={() => setDrawerOpen(false)}
                      className="flex w-full items-center px-6 py-3 text-[14px] text-ink hover:bg-mist transition-colors"
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setDrawerOpen(false)}
                      className="flex w-full items-center px-6 py-3 text-[14px] text-ink hover:bg-mist transition-colors"
                    >
                      Account Settings
                    </Link>
                  </div>
                </div>
              </div>

              {/* Submenu Panel (slides in when activeSubmenu is selected) */}
              <div
                className={`absolute inset-0 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${activeSubmenu ? "translate-x-0" : "translate-x-full"
                  }`}
              >
                {activeSubmenu && (
                  <div className="py-4">
                    {/* Back to main menu */}
                    <button
                      onClick={() => setActiveSubmenu(null)}
                      className="flex w-full items-center gap-3 border-b border-line px-6 pb-4 text-left text-[14px] font-bold text-ink hover:text-nova-600 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>MAIN MENU</span>
                    </button>

                    {/* Subcategories list */}
                    {(() => {
                      const activeCat = MEGA_MENU_CATEGORIES.find((c) => c.slug === activeSubmenu);
                      if (!activeCat) return null;
                      return (
                        <div className="py-4">
                          <h3 className="px-6 text-sm font-bold text-graphite mb-2">
                            {activeCat.emoji} {activeCat.name}
                          </h3>
                          <div className="space-y-0.5">
                            {/* View all option */}
                            <Link
                              href={`/products?category=${activeCat.slug}`}
                              onClick={() => {
                                setDrawerOpen(false);
                                setActiveSubmenu(null);
                              }}
                              className="flex w-full items-center px-6 py-3 text-[14px] font-medium text-nova-600 hover:bg-mist transition-colors"
                            >
                              View All Products
                            </Link>
                            {activeCat.subcategories.map((sub) => (
                              <Link
                                key={sub.slug}
                                href={`/products?category=${sub.slug}`}
                                onClick={() => {
                                  setDrawerOpen(false);
                                  setActiveSubmenu(null);
                                }}
                                className="flex w-full items-center px-6 py-3 text-[14px] text-ink hover:bg-mist transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Image Search Modal */}
      <ImageSearchModal isOpen={imageSearchOpen} onClose={() => setImageSearchOpen(false)} />

      {/* Mobile Bottom Navigation Bar (Exact 100% match to User Reference: Home, New Arrivals, Categories, Account) */}
      {/* Mobile Bottom Navigation Bar (Exact 4 items matching Reference: Home, New Arrivals, Categories, Account) */}
      <nav aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/80 flex items-center justify-around py-2 md:hidden shadow-[0_-1px_6px_rgba(0,0,0,0.03)] safe-area-inset-bottom">
        {/* 1. Home */}
        {(() => {
          const isHome = pathname === "/";
          const homeColor = isHome ? "#6938ef" : "#54637A";
          return (
            <Link
              href="/"
              className="flex flex-col items-center justify-center flex-1 transition-colors group py-0.5 active:scale-95"
            >
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-[24px] h-[24px]" fill="none">
                  <path
                    d="M12 2.5c-.35 0-.7.18-.95.45L3.5 9.5c-.5.44-.8 1.1-.8 1.8v8.2c0 1.1.9 2 2 2h4.8c.55 0 1-.45 1-1v-4.5c0-.55.45-1 1-1s1 .45 1 1V20.5c0 .55.45 1 1 1h4.8c1.1 0 2-.9 2-2v-8.2c0-.7-.3-1.36-.8-1.8l-7.55-6.55c-.25-.27-.6-.45-.95-.45z"
                    fill={homeColor}
                  />
                </svg>
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                  isHome ? "text-[#6938ef] font-bold" : "text-[#54637A] font-medium"
                }`}
              >
                Home
              </span>
            </Link>
          );
        })()}

        {/* 2. New Arrivals */}
        {(() => {
          const isNewArrivals = pathname.startsWith("/new-arrivals");
          const starColor = isNewArrivals ? "#6938ef" : "#54637A";
          return (
            <Link
              href="/new-arrivals"
              className="flex flex-col items-center justify-center flex-1 transition-colors group py-0.5 active:scale-95"
            >
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-[24px] h-[24px]" fill="none">
                  {/* Large 4-point sparkle star on right */}
                  <path
                    d="M16.5 4.2 Q16.5 11 23.3 11 Q16.5 11 16.5 17.8 Q16.5 11 9.7 11 Q16.5 11 16.5 4.2 Z"
                    fill={starColor}
                  />
                  {/* Medium 4-point sparkle star on top-left */}
                  <path
                    d="M6.5 1.0 Q6.5 5.5 11.0 5.5 Q6.5 5.5 6.5 10.0 Q6.5 5.5 2.0 5.5 Q6.5 5.5 6.5 1.0 Z"
                    fill={starColor}
                  />
                  {/* Small 4-point sparkle star on bottom-left */}
                  <path
                    d="M7.5 12.0 Q7.5 15.5 11.0 15.5 Q7.5 15.5 7.5 19.0 Q7.5 15.5 4.0 15.5 Q7.5 15.5 7.5 12.0 Z"
                    fill={starColor}
                  />
                </svg>
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                  isNewArrivals ? "text-[#6938ef] font-bold" : "text-[#54637A] font-medium"
                }`}
              >
                New Arrivals
              </span>
            </Link>
          );
        })()}

        {/* 3. Categories */}
        {(() => {
          const isCategories = pathname.startsWith("/categories");
          const catColor = isCategories ? "#6938ef" : "#54637A";
          return (
            <Link
              href="/categories"
              className="flex flex-col items-center justify-center flex-1 transition-colors group py-0.5 active:scale-95"
            >
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-[24px] h-[24px]" fill="none">
                  {/* Row 1 */}
                  <circle cx="4.2" cy="5.2" r="1.9" fill={catColor} />
                  <line x1="9.2" y1="5.2" x2="22.2" y2="5.2" stroke={catColor} strokeWidth="2.8" strokeLinecap="round" />
                  {/* Row 2 */}
                  <circle cx="4.2" cy="12" r="1.9" fill={catColor} />
                  <line x1="9.2" y1="12" x2="22.2" y2="12" stroke={catColor} strokeWidth="2.8" strokeLinecap="round" />
                  {/* Row 3 */}
                  <circle cx="4.2" cy="18.8" r="1.9" fill={catColor} />
                  <line x1="9.2" y1="18.8" x2="22.2" y2="18.8" stroke={catColor} strokeWidth="2.8" strokeLinecap="round" />
                </svg>
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                  isCategories ? "text-[#6938ef] font-bold" : "text-[#54637A] font-medium"
                }`}
              >
                Categories
              </span>
            </Link>
          );
        })()}

        {/* 4. Account */}
        {(() => {
          const isAccount = pathname.startsWith("/account") || pathname.startsWith("/profile") || pathname.startsWith("/login");
          const accColor = isAccount ? "#6938ef" : "#54637A";
          return (
            <Link
              href={hydrated && user ? "/account" : "/login"}
              className="flex flex-col items-center justify-center flex-1 transition-colors group py-0.5 active:scale-95"
            >
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-[24px] h-[24px]" fill="none">
                  <circle cx="12" cy="7.0" r="4.3" stroke={accColor} strokeWidth="2.4" />
                  <path
                    d="M4.0 20.8 C4.0 15.6 7.6 13.5 12 13.5 C16.4 13.5 20.0 15.6 20.0 20.8"
                    stroke={accColor}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                  isAccount ? "text-[#6938ef] font-bold" : "text-[#54637A] font-medium"
                }`}
              >
                Account
              </span>
            </Link>
          );
        })()}
      </nav>
    </>
  );
}
