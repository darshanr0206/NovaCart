"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { getProfile, updateProfile } from "@/services/auth-service";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, User, Mail, Phone, Calendar, ShieldCheck, Check, Edit2, Loader2 } from "lucide-react";
import { UserProfile } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout, hydrate, hydrated } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !user) {
      router.push("/login?redirect=/profile");
    }
  }, [hydrated, user, router]);

  // Fetch real authenticated user profile from PostgreSQL
  useEffect(() => {
    if (user?.accessToken) {
      loadProfile();
    }
  }, [user?.accessToken]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
      });
    } catch (err) {
      toast.error("Failed to load profile from database");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(formData);
      setProfile(updated as UserProfile);

      // Build the updated auth user, rotating tokens when the backend provides them
      // (this happens when the email changed and the old JWT would have become stale)
      if (user) {
        const updatedUser = {
          ...user,
          fullName: updated.fullName,
          email: updated.email,
          phone: updated.phone || user.phone,
          // Use fresh tokens if the server issued them, otherwise keep the current ones
          ...(updated.accessToken ? { accessToken: updated.accessToken } : {}),
          ...(updated.refreshToken ? { refreshToken: updated.refreshToken } : {}),
        };
        setUser(updatedUser);
      }

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated || !user || loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-nova-600 border-t-transparent" />
      </div>
    );
  }

  const initials = (profile?.fullName || user.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="bg-[#FAFAFB] min-h-[calc(100vh-64px)] pb-24 sm:pb-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="p-2 -ml-2 rounded-xl text-slate-800 hover:bg-slate-100 transition"
              aria-label="Back to Account"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                Profile Details
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage your personal information & contact details
              </p>
            </div>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                if (profile) {
                  setFormData({
                    fullName: profile.fullName || "",
                    email: profile.email || "",
                    phone: profile.phone || "",
                  });
                }
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          {/* Avatar and Header Info */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-[#E5D5FC] text-[#7C3AED] flex items-center justify-center font-black text-xl shadow-2xs shrink-0">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-ink truncate">
                {profile?.fullName || user.fullName}
              </h2>
            </div>
          </div>

          {/* Form / Details view */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Number (10 digits)
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 px-3 py-2.5 focus-within:border-[#7C3AED] focus-within:ring-1 focus-within:ring-[#7C3AED]">
                  <span className="text-sm font-semibold text-slate-500 mr-2">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10),
                      })
                    }
                    className="w-full bg-transparent outline-none text-sm text-ink font-medium"
                    placeholder="9019823918"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to PostgreSQL...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Full Name
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {profile?.fullName || user.fullName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Mobile Phone
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {profile?.phone ? `+91 ${profile.phone}` : user.phone ? `+91 ${user.phone}` : "Not provided"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Email Address
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {profile?.email || user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Member Since
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
