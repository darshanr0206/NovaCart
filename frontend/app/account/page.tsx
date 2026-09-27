"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getProfile } from "@/services/auth-service";
import { ArrowLeft, ChevronRight } from "lucide-react";

export default function AccountDashboardPage() {
  const router = useRouter();
  const { user, setUser, logout, hydrate, hydrated } = useAuthStore();
  const [profileData, setProfileData] = useState<{ fullName?: string; phone?: string; email?: string } | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login?redirect=/account");
    }
  }, [hydrated, user, router]);

  // Load fresh profile info from PostgreSQL
  useEffect(() => {
    if (user?.accessToken) {
      getProfile()
        .then((data) => {
          if (data) {
            setProfileData(data);
            // Update auth store user with fresh data if different
            if (data.fullName !== user.fullName || data.phone !== user.phone) {
              setUser({
                ...user,
                fullName: data.fullName,
                phone: data.phone || user.phone,
                email: data.email,
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [user?.accessToken]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-nova-600 border-t-transparent" />
      </div>
    );
  }

  const displayName = profileData?.fullName || user.fullName || "User";
  const displayPhone = profileData?.phone || user.phone || "9019823918";
  const formattedPhone = displayPhone.startsWith("+91")
    ? displayPhone
    : `+91 ${displayPhone.replace(/(\d{5})(\d{5})/, "$1$2")}`;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const menuItems = [
    {
      label: "Orders",
      href: "/orders",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-black fill-none stroke-[2]">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      label: "Customer Support",
      href: "/support",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-black fill-none stroke-[2]">
          <rect x="3" y="4" width="18" height="15" rx="5" />
          <line x1="8" y1="10" x2="13" y2="10" />
          <line x1="8" y1="13" x2="16" y2="13" />
        </svg>
      ),
    },
    {
      label: "Saved Addresses",
      href: "/account/addresses",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-black fill-none stroke-[2]">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-black fill-none stroke-[2]">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="10" r="3" />
          <path d="M6.168 18.849a4 4 0 0 1 3.832-2.849h4a4 4 0 0 1 3.832 2.849" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white min-h-[calc(100vh-64px)] pb-24 sm:pb-16">
      <div className="max-w-md mx-auto px-5 py-4">
        {/* Top Header with Back Arrow and "Account" Title (Exact match to Reference Image 3) */}
        <div className="flex items-center gap-4 mb-8 pt-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1 && document.referrer.includes(window.location.host)) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            className="p-1 -ml-1 text-black hover:text-nova-600 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
          </button>
          <h1 className="text-xl font-bold text-ink tracking-tight">Account</h1>
        </div>

        {/* User Card matching reference image 3 */}
        <div className="flex items-center gap-4 mb-10">
          {/* Lavender/Purple circle with solid purple person silhouette */}
          <div className="w-16 h-16 rounded-full bg-[#E5D5FC] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-9 h-9 fill-[#7C3AED]">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-ink tracking-tight truncate">
              {displayName}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5 tracking-tight">
              {formattedPhone}
            </p>
          </div>
        </div>

        {/* 4 Menu Rows with Red Right Arrows (Exact match to Reference Image 3) */}
        <div className="space-y-6 mb-16">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between py-1 group transition"
            >
              <div className="flex items-center gap-5">
                <div className="shrink-0 transition-transform group-hover:scale-105">
                  {item.icon}
                </div>
                <span className="text-base font-semibold text-ink group-hover:text-nova-600 transition-colors">
                  {item.label}
                </span>
              </div>

              {/* Red / Coral Right Arrow Chevron matching reference */}
              <ChevronRight className="w-5 h-5 stroke-[#EF4444] stroke-[2.4] transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        {/* Log Out Button (Exact match to Reference Image 3: Red outlined rounded button) */}
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="px-10 py-2.5 rounded-xl border border-[#F43F5E] text-[#F43F5E] font-semibold text-sm hover:bg-rose-50 active:scale-[0.98] transition-all shadow-2xs"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
