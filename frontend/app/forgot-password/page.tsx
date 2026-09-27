"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/services/auth-service";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-content flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-graphite">Enter the email linked to your account.</p>

        {sent ? (
          <p className="mt-6 rounded-lg bg-nova-50 p-4 text-sm text-nova-700">
            If an account exists for that email, we&rsquo;ve sent password reset instructions.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-nova-500"
            />
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-graphite">
          <Link href="/login" className="font-medium text-nova-600 hover:text-nova-700">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
