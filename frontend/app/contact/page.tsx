"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    topic: "ORDER_INQUIRY",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitted(true);
    toast.success("Thank you! Your message has been received. Our support team will reply within 24 hours.");
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-content max-w-5xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="px-3 py-1 bg-nova-100 text-nova-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Contact Us
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
            We’re Here to Help
          </h1>
          <p className="text-sm md:text-base text-graphite">
            Have questions about an order, payment, or seller registration? Reach out to our 24/7 dedicated support team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Cards (1 Col) */}
          <div className="space-y-4">
            <div className="card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-nova-50 flex items-center justify-center text-nova-600">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-ink text-sm">Customer Email Support</h3>
              <p className="text-xs text-graphite">
                support@novacart.app<br />
                helpdesk@novacart.app
              </p>
              <span className="text-[11px] text-nova-600 font-semibold block">Average response time: &lt; 2 hrs</span>
            </div>

            <div className="card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-ink text-sm">Toll-Free Helpline</h3>
              <p className="text-xs text-graphite">
                +91 (800) 123-6682<br />
                +91 (080) 4567-8900
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold block">Available Mon–Sun: 8 AM – 10 PM IST</span>
            </div>

            <div className="card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-ink text-sm">Corporate Office</h3>
              <p className="text-xs text-graphite leading-relaxed">
                NovaCart Technologies Pvt. Ltd.<br />
                Indiranagar 100ft Road, Bengaluru, Karnataka 560038, India
              </p>
            </div>
          </div>

          {/* Contact Message Form (2 Cols) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-line p-8 shadow-sm">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-ink">Message Sent Successfully!</h3>
                  <p className="text-sm text-graphite max-w-md mx-auto">
                    Thank you for contacting NovaCart. We have assigned ticket #NC-{Math.floor(100000 + Math.random() * 900000)} to your inquiry and our team will get back to you shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", subject: "", topic: "ORDER_INQUIRY", message: "" });
                    }}
                    className="btn-secondary text-xs mt-4"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-line pb-4 mb-2">
                    <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-nova-600" />
                      Send Us a Message
                    </h2>
                    <p className="text-xs text-graphite mt-1">
                      Fill out the form below and our customer success representatives will respond promptly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-graphite mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sagar Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full text-sm bg-slate-50 border border-line rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-nova-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-graphite mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="sagar@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-sm bg-slate-50 border border-line rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-nova-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-graphite mb-1.5">
                        Inquiry Topic
                      </label>
                      <select
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className="w-full text-sm bg-slate-50 border border-line rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-nova-500 focus:bg-white transition font-medium"
                      >
                        <option value="ORDER_INQUIRY">Order Tracking & Delivery</option>
                        <option value="PAYMENT_RAZORPAY">Payment & Razorpay Verification</option>
                        <option value="RETURNS_REFUNDS">Returns & Refund Request</option>
                        <option value="SELLER_INQUIRY">Seller Registration & Marketplace</option>
                        <option value="ACCOUNT_GENERAL">Account & Technical Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-graphite mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        placeholder="Brief summary of your issue"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full text-sm bg-slate-50 border border-line rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-nova-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-graphite mb-1.5">
                      Message / Details *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Please include order number (if applicable) and describe how we can assist you..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full text-sm bg-slate-50 border border-line rounded-lg p-3.5 focus:outline-none focus:border-nova-500 focus:bg-white transition resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-semibold shadow-sm text-sm"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links Banner */}
        <div className="mt-12 bg-white rounded-xl border border-line p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-ink text-sm">Looking for live order updates?</h4>
            <p className="text-xs text-graphite mt-0.5">Track your packages in real time with our 7-stage fulfillment tracking.</p>
          </div>
          <Link href="/orders" className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-4">
            <span>Go to My Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
