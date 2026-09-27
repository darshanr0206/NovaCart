"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { sendOtp, verifyOtp } from "@/services/auth-service";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Pencil, ArrowLeft, Loader2 } from "lucide-react";

function LoginOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams?.get("reason");
  const redirectParam = searchParams?.get("redirect");
  const redirectTo = (redirectParam && redirectParam !== "/login" && redirectParam !== "/account")
    ? redirectParam
    : "/";

  const { user, setUser, hydrate, hydrated } = useAuthStore();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(18);
  const [canResend, setCanResend] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // If already logged in, automatically take to Home page
  useEffect(() => {
    if (hydrated && user) {
      router.replace(redirectTo);
    }
  }, [hydrated, user, router, redirectTo]);

  // Resend countdown timer (18 seconds matching reference image)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Focus first OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setPhone(value);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
      }
      setStep("otp");
      setResendTimer(18);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      toast.success(`OTP sent to +91 ${phone}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
      }
      setResendTimer(18);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      toast.success(`New OTP sent to +91 ${phone}`);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to resend OTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);

    // Auto advance to next input
    if (cleanDigit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // If all 6 digits filled, trigger verification automatically
    if (cleanDigit && newDigits.every((d) => d.length === 1)) {
      verifyCode(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || "";
    }
    setOtpDigits(newDigits);

    if (pastedData.length === 6) {
      otpInputsRef.current[5]?.focus();
      verifyCode(pastedData);
    } else {
      const nextIndex = Math.min(pastedData.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
    }
  };

  const verifyCode = async (otpString: string) => {
    if (otpString.length !== 6 || loading) return;
    setLoading(true);
    try {
      const authUser = await verifyOtp({
        phone,
        otp: otpString,
      });
      setUser(authUser);
      toast.success(`Welcome to NovaCart, ${authUser.fullName || "User"}`);
      router.replace(redirectTo);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid OTP code. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated || user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-nova-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[calc(100vh-140px)] flex flex-col justify-between py-8 sm:py-10 px-4 sm:px-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
        {step === "phone" ? (
          /* =========================================================================
             STEP 1: PHONE NUMBER INPUT (Exact visual match to Reference Image 1)
             ========================================================================= */
          <div className="w-full max-w-sm mx-auto">
            {/* Session-expired notice shown when redirected from a protected page */}
            {reason === "session_expired" && (
              <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 mt-0.5 fill-amber-500" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-5a1 1 0 0 1-2 0V8a1 1 0 0 1 2 0v4z"/>
                </svg>
                <span>Your session has expired. Please log in again to continue.</span>
              </div>
            )}
            {/* Horizontal Brand Logo matching user reference Image 2 */}
            <div className="flex items-center justify-center gap-3.5 mb-10">
              {/* Black rounded-square icon with purple star sparkle */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-2xl flex items-center justify-center shadow-xs shrink-0">
                <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9 fill-[#8B5CF6]">
                  <path d="M12 2C12 7.523 7.523 12 2 12C7.523 12 12 16.477 12 22C12 16.477 16.477 12 22 12C16.477 12 12 7.523 12 2Z" />
                </svg>
              </div>

              {/* NovaCart Wordmark & Tagline side-by-side */}
              <div className="flex flex-col justify-center">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-ink flex items-center leading-none">
                  <span>Nova</span>
                  <span className="text-[#7C3AED]">Cart</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 tracking-tight">
                  Many Sellers. One Cart.
                </p>
              </div>
            </div>

            {/* Outlined Phone Input Box */}
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="relative border border-slate-700 rounded-xl px-4 py-3 bg-white focus-within:border-black transition-all">
                {/* Outlined Label on top border */}
                <label className="absolute -top-2.5 left-3.5 bg-white px-1.5 text-xs text-slate-500 font-medium select-none">
                  Enter Phone Number
                </label>

                <div className="flex items-center gap-2.5">
                  {/* Indian Flag SVG */}
                  <svg className="w-6 h-4 rounded-xs shadow-2xs shrink-0" viewBox="0 0 24 16">
                    <rect width="24" height="5.33" fill="#FF9933" />
                    <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
                    <rect y="10.66" width="24" height="5.33" fill="#138808" />
                    <circle cx="12" cy="8" r="2.2" fill="none" stroke="#000080" strokeWidth="0.6" />
                  </svg>

                  {/* +91 Country Code */}
                  <span className="text-base font-semibold text-ink">+91</span>

                  {/* Dropdown chevron */}
                  <svg className="w-3 h-3 text-slate-500 shrink-0" viewBox="0 0 10 6" fill="currentColor">
                    <path d="M0 0.5L5 5.5L10 0.5H0Z" />
                  </svg>

                  {/* Divider */}
                  <span className="h-5 w-[1px] bg-slate-300 mx-1 shrink-0" />

                  {/* Phone number input */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter Phone Number"
                    maxLength={10}
                    className="w-full bg-transparent outline-none text-base text-ink placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                disabled={phone.length !== 10 || loading}
                className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                  phone.length === 10 && !loading
                    ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-sm active:scale-[0.99]"
                    : "bg-[#EAEBED] text-[#6E7380] cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* =========================================================================
             STEP 2: OTP VERIFICATION (Exact visual match to Reference Image 2)
             ========================================================================= */
          <div className="w-full max-w-sm mx-auto">
            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mb-2">
              OTP Verification
            </h2>

            {/* Subtitle with Pencil Edit Icon */}
            <div className="flex items-center gap-2 text-slate-600 text-sm sm:text-base font-medium mb-8">
              <span>OTP has been sent to +91 {phone}</span>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtpDigits(["", "", "", "", "", ""]);
                }}
                className="text-slate-800 hover:text-nova-600 p-0.5 transition"
                aria-label="Edit mobile number"
              >
                <Pencil className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* 6 OTP Input Boxes */}
            <div className="grid grid-cols-6 gap-2.5 sm:gap-3 mb-6" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className={`w-full aspect-square max-w-[54px] rounded-xl sm:rounded-2xl text-center text-xl sm:text-2xl font-bold transition-all outline-none ${
                    digit
                      ? "bg-white border-2 border-black text-ink shadow-2xs"
                      : "bg-[#F0F2F5] border border-transparent text-ink focus:border-black focus:bg-white"
                  }`}
                />
              ))}
            </div>

            {/* Dev helper toast info in testing mode */}
            {devOtpCode && (
              <div className="mb-4 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 flex items-center justify-between">
                <span>Testing OTP: <strong>{devOtpCode}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    const digits = devOtpCode.split("");
                    setOtpDigits(digits);
                    verifyCode(devOtpCode);
                  }}
                  className="font-bold underline text-purple-700"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* Countdown / Resend Action */}
            <div className="mb-8">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm font-semibold text-[#7C3AED] hover:underline"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-sm font-medium text-slate-500">
                  Resend OTP in <span className="font-semibold text-slate-700">{resendTimer}s</span>
                </p>
              )}
            </div>

            {/* Manual Verify button */}
            <button
              type="button"
              onClick={() => verifyCode(otpDigits.join(""))}
              disabled={otpDigits.some((d) => !d) || loading}
              className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                otpDigits.every((d) => d) && !loading
                  ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-sm active:scale-[0.99]"
                  : "bg-[#EAEBED] text-[#6E7380] cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Centered Footer Text (Exact match to Reference Image 1) */}
      <div className="text-center pt-8 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
        <p>By continuing, you agree to our</p>
        <p className="mt-0.5">
          <Link href="/terms" className="text-[#7C3AED] hover:underline font-medium">
            Terms of Use
          </Link>
          {" & "}
          <Link href="/privacy" className="text-[#7C3AED] hover:underline font-medium">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-nova-600 border-t-transparent" />
        </div>
      }
    >
      <LoginOtpContent />
    </Suspense>
  );
}
