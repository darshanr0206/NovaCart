"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-white">
      <p className="text-sm text-slate-500">Redirecting to Log In / Sign Up...</p>
    </div>
  );
}
