"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, HelpCircle, Package, CreditCard, RotateCcw, User, Store, ChevronDown, MessageSquare, ArrowRight } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "orders" | "payments" | "returns" | "account" | "seller";
}

const FAQS: FAQItem[] = [
  {
    category: "orders",
    question: "How do I track my order status?",
    answer: "You can track your order at any time by visiting the 'My Orders' section under your account. We provide real-time updates through 7 stages: Order Placed → Confirmed → Processing → Packed → Shipped → Out for Delivery → Delivered.",
  },
  {
    category: "orders",
    question: "Can I change my delivery address after placing an order?",
    answer: "If your order has not yet entered the 'Packed' or 'Shipped' stage, you can update your delivery details by contacting our support helpline or submitting a request via the Contact Us form.",
  },
  {
    category: "payments",
    question: "What payment methods are supported on NovaCart?",
    answer: "NovaCart supports Razorpay online payments (Credit/Debit cards, UPI, Net Banking, and Wallets) as well as Cash on Delivery (COD) for eligible pin codes.",
  },
  {
    category: "payments",
    question: "How does payment screenshot verification work?",
    answer: "For manual UPI/QR transfers via Razorpay, you can upload your payment confirmation screenshot directly during checkout. Our automated system and merchant team verify the transaction ID to confirm your order immediately.",
  },
  {
    category: "returns",
    question: "What is NovaCart's Return & Refund Policy?",
    answer: "We offer a 7-day hassle-free return window for most eligible items. Products must be in unused condition with original tags, packaging, and invoice intact. Once verified, refunds are credited to your original payment method within 3–5 business days.",
  },
  {
    category: "returns",
    question: "How do I request a return or replacement?",
    answer: "Go to 'My Orders', select the delivered order, and click 'Request Return'. Specify the reason and upload a photo if the item arrived damaged or defective. A courier pickup will be scheduled within 48 hours.",
  },
  {
    category: "account",
    question: "How do I reset my account password?",
    answer: "Click on 'Login' in the header, then select 'Forgot Password?'. Enter your registered email address to receive password reset instructions.",
  },
  {
    category: "seller",
    question: "How do I become a seller on NovaCart?",
    answer: "Visit the 'Become a Seller' page (/seller/register), complete the quick business registration form, and submit your GST/PAN details. Our seller onboarding team approves eligible accounts within 24 hours.",
  },
];

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-content max-w-5xl">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-8 md:p-12 text-center shadow-md mb-10 space-y-4">
          <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full uppercase tracking-wider">
            Help Center
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            How can we assist you today?
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto">
            Find quick answers to common questions regarding orders, payments, delivery, returns, and seller services.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative pt-2">
            <Search className="absolute left-4 top-5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search help articles, topics, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white text-ink text-sm rounded-xl focus:outline-none shadow-sm placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {[
            { id: "all", label: "All Topics", icon: HelpCircle },
            { id: "orders", label: "Orders & Tracking", icon: Package },
            { id: "payments", label: "Payments & Razorpay", icon: CreditCard },
            { id: "returns", label: "Returns & Refunds", icon: RotateCcw },
            { id: "account", label: "Account & Profile", icon: User },
            { id: "seller", label: "Seller Information", icon: Store },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-nova-600 text-white shadow-sm"
                    : "bg-white text-graphite border border-line hover:border-nova-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-2xl border border-line p-6 md:p-8 shadow-sm space-y-4 mb-10">
          <h2 className="text-lg font-bold text-ink mb-4">Frequently Asked Questions</h2>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-graphite">
              <HelpCircle className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-sm font-medium">No help articles found matching &quot;{searchQuery}&quot;.</p>
              <p className="text-xs">Try searching with other keywords or contact our support team directly.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-line rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setExpandedIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition"
                  >
                    <span className="text-sm font-bold text-ink">{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-graphite shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-nova-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-graphite leading-relaxed bg-slate-50/50 border-t border-line/60">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Need Help CTA */}
        <div className="bg-white rounded-2xl border border-line p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-ink flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-nova-600" />
              Still need assistance?
            </h3>
            <p className="text-xs text-graphite">
              Our 24/7 dedicated support team is available via email, phone, and ticketing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/contact" className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2">
              <span>Contact Support</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/orders" className="btn-secondary text-xs py-2.5 px-4">
              Track My Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
