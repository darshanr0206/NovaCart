"use client";

import { useState } from "react";
import { Briefcase, MapPin, Sparkles, Heart, Zap, Shield, ArrowRight, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
}

const JOBS: JobOpening[] = [
  {
    id: "FE-2026",
    title: "Senior Full-Stack Engineer (Next.js & Java/Spring)",
    department: "Engineering",
    location: "Bengaluru, India (Hybrid)",
    type: "Full-Time",
    description: "Design and scale high-performance multi-vendor e-commerce interfaces, payment integrations, and real-time order tracking systems.",
  },
  {
    id: "BE-2026",
    title: "Lead Backend Architect (Spring Boot & Distributed Systems)",
    department: "Engineering",
    location: "Bengaluru, India / Remote",
    type: "Full-Time",
    description: "Optimize PostgreSQL queries, product search indexing, Razorpay payment reconciliation, and multi-tenant seller APIs.",
  },
  {
    id: "PD-2026",
    title: "Product Designer (UI/UX & Design Systems)",
    department: "Design",
    location: "Bengaluru, India",
    type: "Full-Time",
    description: "Create delightful consumer shopping experiences and intuitive merchant dashboards for thousands of active sellers.",
  },
  {
    id: "OPS-2026",
    title: "Merchant Operations & Onboarding Specialist",
    department: "Operations",
    location: "Mumbai / Bengaluru, India",
    type: "Full-Time",
    description: "Empower new independent brands to register, catalog inventory, and achieve growth on the NovaCart platform.",
  },
  {
    id: "LOG-2026",
    title: "Supply Chain & Fulfillment Manager",
    department: "Logistics",
    location: "Delhi NCR, India",
    type: "Full-Time",
    description: "Oversee regional warehouse logistics, 7-stage fulfillment tracking, and courier delivery SLAs across India.",
  },
];

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [applicant, setApplicant] = useState({ name: "", email: "", phone: "", linkedin: "", cover: "" });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Application submitted for ${selectedJob?.title}! Our recruiting team will review your profile.`);
    setSelectedJob(null);
    setApplicant({ name: "", email: "", phone: "", linkedin: "", cover: "" });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-content max-w-5xl space-y-12">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl border border-line p-8 md:p-14 shadow-sm text-center relative overflow-hidden">
          <span className="px-3 py-1 bg-nova-100 text-nova-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Careers at NovaCart
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-ink tracking-tight mt-3">
            Build the Future of <span className="text-nova-600">Commerce</span>
          </h1>
          <p className="text-base md:text-lg text-graphite max-w-2xl mx-auto mt-3 leading-relaxed">
            Join a fast-moving, passionate team empowering independent brands and revolutionizing the shopping experience for millions across India.
          </p>
        </div>

        {/* Benefits Grid */}
        <div>
          <h2 className="text-2xl font-bold text-ink text-center mb-8">Why You&apos;ll Love Working at NovaCart</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-nova-50 text-nova-600 flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">High-Impact Projects</h3>
              <p className="text-xs text-graphite leading-relaxed">
                Work on core distributed systems handling millions of product queries, live payments, and real-time inventory.
              </p>
            </div>

            <div className="card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">Comprehensive Healthcare</h3>
              <p className="text-xs text-graphite leading-relaxed">
                Top-tier medical insurance for you and your family, wellness allowances, and mental health support programs.
              </p>
            </div>

            <div className="card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">Growth & Learning</h3>
              <p className="text-xs text-graphite leading-relaxed">
                Annual learning stipend, tech conference sponsorships, and leadership mentorship programs.
              </p>
            </div>

            <div className="card p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">Flexible Work Culture</h3>
              <p className="text-xs text-graphite leading-relaxed">
                Hybrid collaboration model, generous paid time off, and flexible hours designed for work-life harmony.
              </p>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-white rounded-2xl border border-line p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
            <div>
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-nova-600" />
                Open Opportunities ({JOBS.length})
              </h2>
              <p className="text-xs text-graphite mt-1">Explore current openings across our product, engineering, and operations teams.</p>
            </div>
          </div>

          <div className="space-y-4">
            {JOBS.map((job) => (
              <div
                key={job.id}
                className="border border-line rounded-xl p-5 hover:border-nova-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-nova-50 text-nova-700 text-[11px] font-bold rounded-full">
                      {job.department}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 text-[11px] font-medium rounded-full">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-ink">{job.title}</h3>
                  <p className="text-xs text-graphite leading-relaxed">{job.description}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
                    <MapPin className="h-3.5 w-3.5 text-nova-600" />
                    <span>{job.location}</span>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedJob(job)}
                  className="btn-primary text-xs py-2.5 px-4 whitespace-nowrap self-start md:self-center flex items-center gap-1.5"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Application Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="text-xs font-bold text-nova-600 uppercase tracking-wider">{selectedJob.department}</span>
                <h3 className="text-xl font-bold text-ink mt-0.5">Apply for {selectedJob.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedJob.location}</p>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-graphite mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aditi Rao"
                    value={applicant.name}
                    onChange={(e) => setApplicant({ ...applicant, name: e.target.value })}
                    className="w-full text-sm bg-slate-50 border border-line rounded-lg px-3 py-2 focus:outline-none focus:border-nova-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-graphite mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="aditi@example.com"
                      value={applicant.email}
                      onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                      className="w-full text-sm bg-slate-50 border border-line rounded-lg px-3 py-2 focus:outline-none focus:border-nova-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-graphite mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={applicant.phone}
                      onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                      className="w-full text-sm bg-slate-50 border border-line rounded-lg px-3 py-2 focus:outline-none focus:border-nova-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-graphite mb-1">LinkedIn / Portfolio URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={applicant.linkedin}
                    onChange={(e) => setApplicant({ ...applicant, linkedin: e.target.value })}
                    className="w-full text-sm bg-slate-50 border border-line rounded-lg px-3 py-2 focus:outline-none focus:border-nova-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-graphite mb-1">Why NovaCart? (Cover Note)</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your background and relevant experience..."
                    value={applicant.cover}
                    onChange={(e) => setApplicant({ ...applicant, cover: e.target.value })}
                    className="w-full text-sm bg-slate-50 border border-line rounded-lg p-3 focus:outline-none focus:border-nova-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 px-5 font-semibold"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
