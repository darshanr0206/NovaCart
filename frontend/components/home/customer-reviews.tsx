"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

const REVIEWS = [
  {
    quote:
      "\u201cNovaCart has completely changed how I shop. The product quality and delivery speed are unmatched!\u201d",
    name: "Priya Sharma",
    city: "Mumbai",
    initials: "PS",
  },
  {
    quote:
      "\u201cThe \u2018Many Sellers, One Cart\u2019 concept is genius. I compare prices and get the best deal every time.\u201d",
    name: "Arjun Menon",
    city: "Bangalore",
    initials: "AM",
  },
  {
    quote:
      "\u201cPremium experience at every step \u2014 from browsing to unboxing. NovaCart is my go-to now.\u201d",
    name: "Rhea Kapoor",
    city: "Delhi",
    initials: "RK",
  },
];

// Avatar colour palette per index
const AVATAR_COLORS = ["bg-[#6938ef]", "bg-[#0ea5e9]", "bg-[#10b981]"];

export function CustomerReviews() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubscribed(true);
    toast.success("Thank you for subscribing to NovaCart deals!");
  };

  return (
    <section className="w-full space-y-10 sm:space-y-14 pt-4">
      {/* ── Customer Testimonials ── */}
      <div className="space-y-5">
        {/* Section header */}
        <div className="text-center space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#6938ef] block">
            REVIEWS
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            What our customers say
          </h2>
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {REVIEWS.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_1px_6px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex flex-col gap-4"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed flex-1">
                {rev.quote}
              </p>

              {/* User identity */}
              <div className="flex items-center gap-3 pt-1">
                <div
                  className={`h-9 w-9 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-white font-bold text-[11px] flex items-center justify-center shrink-0`}
                >
                  {rev.initials}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900 leading-none">{rev.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{rev.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Newsletter ── */}
      <div className="max-w-2xl mx-auto text-center space-y-4 px-2">
        {/* Icon */}
        <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-rose-50 border border-rose-100 shadow-xs">
          <span className="text-xl" aria-hidden>💌</span>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Stay ahead of the deals
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Get exclusive offers, early access to flash sales, and curated picks delivered to
            your inbox &mdash; no spam, ever.
          </p>
        </div>

        {/* Email form */}
        <form
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto pt-1"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={subscribed}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 outline-none focus:border-[#6938ef] focus:ring-2 focus:ring-[#6938ef]/10 transition-all placeholder:text-slate-400"
            required
          />
          <button
            type="submit"
            disabled={subscribed}
            className="w-full sm:w-auto bg-[#6938ef] hover:bg-[#5b2ee0] active:scale-95 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-sm hover:shadow-md shrink-0 flex items-center justify-center gap-1.5 disabled:bg-emerald-600"
          >
            {subscribed ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Subscribed!</span>
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
