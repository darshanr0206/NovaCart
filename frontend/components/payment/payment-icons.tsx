import React from "react";

// ==========================================
// OFFICIAL UPI APP ICONS (Compact Square / Rounded)
// ==========================================

export function PhonePeIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl bg-[#5f259f] shadow-sm overflow-hidden p-1.5 ${className}`}
      title="PhonePe"
    >
      <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#5F259F" />
        {/* White circle glow background */}
        <circle cx="20" cy="20" r="17" fill="white" fillOpacity="0.12" />
        {/* Official Devanagari 'पे' shape */}
        <path
          d="M19.5 8h9.5c1.1 0 2 .9 2 2s-.9 2-2 2h-4.5v3.2c3.5.5 6 3.4 6 6.8 0 3.9-3.1 7-7 7s-7-3.1-7-7c0-.8.1-1.5.4-2.2l-3.2 4.2c-.7.9-2 .9-2.8.2-.8-.7-.9-1.9-.2-2.7l9.8-13c.4-.5 1-.7 1.5-.5zM23 18.2c-1.8 0-3.2 1.4-3.2 3.2 0 1.8 1.4 3.2 3.2 3.2s3.2-1.4 3.2-3.2c0-1.8-1.4-3.2-3.2-3.2z"
          fill="#FFFFFF"
        />
        {/* Top matra stroke */}
        <path
          d="M17.8 7.5c.3-.8 1.2-1.2 2-.9.8.3 1.2 1.2.9 2l-2.2 5.5c-.3.8-1.2 1.2-2 .9-.8-.3-1.2-1.2-.9-2l2.2-5.5z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}

export function GooglePayIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl bg-white border border-slate-200/90 shadow-sm p-1.5 ${className}`}
      title="Google Pay"
    >
      <svg viewBox="0 0 36 36" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Google 4-color 'G' mark */}
        <path
          d="M31.6 18.4c0-1-.1-2-.3-2.9H18v5.6h7.7c-.3 1.9-1.4 3.6-3 4.7v3.8h4.8c2.8-2.6 4.4-6.4 4.4-11.2z"
          fill="#4285F4"
        />
        <path
          d="M18 32.2c3.9 0 7.2-1.3 9.6-3.5l-4.8-3.8c-1.3.9-3 1.4-4.8 1.4-3.7 0-6.9-2.5-8-5.9H4.9v4C7.3 28.9 12.3 32.2 18 32.2z"
          fill="#34A853"
        />
        <path
          d="M10 20.4c-.3-.9-.4-1.9-.4-2.9s.2-2 .4-2.9v-4H4.9C3.9 12.6 3.4 15.2 3.4 18s.5 5.4 1.5 7.4l5.1-4z"
          fill="#FBBC05"
        />
        <path
          d="M18 9.7c2.2 0 4.1.8 5.6 2.2l4.2-4.2C25.2 5.3 21.8 3.8 18 3.8c-5.7 0-10.7 3.3-13.1 7.8l5.1 4c1.1-3.4 4.3-5.9 8-5.9z"
          fill="#EA4335"
        />
      </svg>
    </div>
  );
}

export function PaytmIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl bg-white border border-slate-200/90 shadow-sm p-1 ${className}`}
      title="Paytm"
    >
      <svg viewBox="0 0 36 36" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="8" fill="#F8FAFC" />
        <text
          x="3"
          y="23"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="12"
          letterSpacing="-0.5px"
          fill="#002E6E"
        >
          Pay
        </text>
        <text
          x="22"
          y="23"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="12"
          letterSpacing="-0.5px"
          fill="#00BAF2"
        >
          tm
        </text>
        <circle cx="33" cy="14" r="1.8" fill="#00BAF2" />
      </svg>
    </div>
  );
}

export function BhimUpiIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl bg-white border border-slate-200/90 shadow-sm p-1 ${className}`}
      title="BHIM UPI"
    >
      <svg viewBox="0 0 36 36" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="8" fill="#FFFFFF" />
        {/* Tricolor NPCI Chevrons */}
        <path d="M7 8l6 10-6 10V8z" fill="#008844" />
        <path d="M15 8l6 10-6 10V8z" fill="#F47820" />
        <text
          x="23"
          y="23"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontStyle="italic"
          fontWeight="900"
          fontSize="10"
          letterSpacing="-0.3px"
          fill="#092040"
        >
          UPI
        </text>
      </svg>
    </div>
  );
}

// ==========================================
// OFFICIAL UPI APP FULL LOGOS (Horizontal Badges)
// ==========================================

export function GooglePayLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-lg bg-white border border-slate-200/90 shadow-2xs px-2.5 py-1 ${className}`}>
      <svg viewBox="0 0 84 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Google 'G' Mark */}
        <g transform="translate(2, 2)">
          <path
            d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1.2-.9 2.3-2 3.1v2.5h3.2c1.9-1.8 3-4.4 3-7.4z"
            fill="#4285F4"
          />
          <path
            d="M10 20c2.7 0 5-1 6.7-2.6l-3.2-2.5c-.9.6-2 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2H1.1v2.6C2.8 17.7 6.1 20 10 20z"
            fill="#34A853"
          />
          <path
            d="M4.3 11.7c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V5.1H1.1C.4 6.5 0 8.2 0 10s.4 3.5 1.1 4.9l3.2-2.6z"
            fill="#FBBC05"
          />
          <path
            d="M10 4.1c1.5 0 2.8.5 3.9 1.5l2.9-2.9C15 1 12.7 0 10 0 6.1 0 2.8 2.3 1.1 5.7l3.2 2.6C5.1 5.9 7.3 4.1 10 4.1z"
            fill="#EA4335"
          />
        </g>
        {/* 'Pay' Typography */}
        <g fill="#5F6368" transform="translate(26, 0)">
          <path d="M12.5 7h-4.3v10.5h2.2v-3.7h2.1c2.2 0 4-1.6 4-3.4s-1.8-3.4-4-3.4zm-.1 4.8h-2.1V9h2.1c1.2 0 2 .8 2 1.4s-.8 1.4-2 1.4z" />
          <path d="M22.1 10c-1.3 0-2.3.6-2.8 1.5V10.2h-2v7.3h2.1v-3.8c0-1.1.8-1.8 1.8-1.8.9 0 1.6.6 1.6 1.7v3.9h2.1v-4.2c0-2.1-1.3-3.3-2.8-3.3z" />
          <path d="M32.2 10.1l-2.5 6.3-2.5-6.3h-2.3l3.7 8.5-2.1 4.7h2.2l6-13.2h-2.5z" />
        </g>
      </svg>
    </div>
  );
}

export function PhonePeLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-lg bg-[#5f259f] shadow-2xs px-2.5 py-1 ${className}`}>
      <svg viewBox="0 0 94 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* PhonePe Emblem Icon */}
        <rect x="1" y="1" width="22" height="22" rx="6" fill="#FFFFFF" fillOpacity="0.18" />
        <path
          d="M10.8 4.5h4.2c1.2 0 2.2 1 2.2 2.2 0 1.2-1 2.2-2.2 2.2H12v3.2c0 .6-.5 1.1-1.1 1.1s-1.1-.5-1.1-1.1V4.5h1z"
          fill="#FFFFFF"
        />
        <path
          d="M13.8 11.2l3.4 4.8c.3.4.2 1-.2 1.3-.4.3-1 .2-1.3-.2L12.4 12l1.4-.8z"
          fill="#FFFFFF"
        />
        <circle cx="13" cy="7" r="1.2" fill="#5F259F" />
        {/* Wordmark */}
        <text
          x="28"
          y="17"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="14"
          letterSpacing="-0.4px"
          fill="#FFFFFF"
        >
          PhonePe
        </text>
      </svg>
    </div>
  );
}

export function PaytmLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-lg bg-white border border-slate-200/90 shadow-2xs px-2.5 py-1 ${className}`}>
      <svg viewBox="0 0 78 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text
          x="2"
          y="17.5"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="16"
          letterSpacing="-0.5px"
          fill="#002E6E"
        >
          Pay
        </text>
        <text
          x="38"
          y="17.5"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="16"
          letterSpacing="-0.5px"
          fill="#00BAF2"
        >
          tm
        </text>
        <circle cx="64" cy="7" r="2.2" fill="#00BAF2" />
      </svg>
    </div>
  );
}

export function BhimUpiLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-lg bg-white border border-slate-200/90 shadow-2xs px-2.5 py-1 ${className}`}>
      <svg viewBox="0 0 86 24" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Chevrons */}
        <path d="M4 5l6 7-6 7V5z" fill="#008844" />
        <path d="M12 5l6 7-6 7V5z" fill="#F47820" />
        {/* BHIM */}
        <text
          x="23"
          y="17"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="12.5"
          letterSpacing="0.4px"
          fill="#092040"
        >
          BHIM
        </text>
        <line x1="59" y1="5" x2="59" y2="19" stroke="#E2E8F0" strokeWidth="1.5" />
        {/* UPI */}
        <text
          x="63"
          y="17"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontStyle="italic"
          fontWeight="900"
          fontSize="12"
          letterSpacing="0.2px"
          fill="#008844"
        >
          UPI
        </text>
      </svg>
    </div>
  );
}

export function OfficialUpiLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 54 20" className="h-5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 3l6 7-6 7V3z" fill="#008844" />
        <path d="M10 3l6 7-6 7V3z" fill="#F47820" />
        <text
          x="20"
          y="16"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontStyle="italic"
          fontWeight="900"
          fontSize="14"
          letterSpacing="-0.2px"
          fill="#092040"
        >
          UPI
        </text>
      </svg>
    </div>
  );
}

// ==========================================
// CARD PROVIDER LOGOS
// ==========================================

export function VisaLogo({ className = "h-5 w-10" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded bg-[#1A1F71] px-1.5 py-0.5 shadow-2xs ${className}`}>
      <svg viewBox="0 0 48 24" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="5" y="18" fontFamily="system-ui, -apple-system, sans-serif" fontStyle="italic" fontWeight="900" fontSize="17" fill="#FFFFFF">VISA</text>
      </svg>
    </div>
  );
}

export function MastercardLogo({ className = "h-5 w-9" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded bg-slate-900 px-1 py-0.5 shadow-2xs ${className}`}>
      <svg viewBox="0 0 36 24" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="12" r="8" fill="#EB001B" />
        <circle cx="23" cy="12" r="8" fill="#F79E1B" fillOpacity="0.85" />
      </svg>
    </div>
  );
}

export function RuPayLogo({ className = "h-5 w-11" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded bg-white border border-slate-200 px-1.5 py-0.5 shadow-2xs ${className}`}>
      <svg viewBox="0 0 48 24" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="17" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="13" fill="#097938">Ru</text>
        <text x="20" y="17" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="13" fill="#F37021">Pay</text>
        <path d="M42 6l4 6-4 6V6z" fill="#F37021" />
      </svg>
    </div>
  );
}

export function BankLogo({ bankId, className = "h-7 w-7" }: { bankId: string; className?: string }) {
  switch (bankId) {
    case "HDFC":
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#004B8D] text-white font-black text-[10px] shadow-2xs ${className}`}>
          HDFC
        </div>
      );
    case "SBI":
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#280071] text-[#00A4E4] font-black text-[10px] shadow-2xs ${className}`}>
          SBI
        </div>
      );
    case "ICICI":
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#B32025] text-[#F37021] font-black text-[9px] shadow-2xs ${className}`}>
          ICICI
        </div>
      );
    case "AXIS":
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#97144D] text-white font-black text-[9px] shadow-2xs ${className}`}>
          AXIS
        </div>
      );
    case "KOTAK":
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#ED1C24] text-white font-black text-[9px] shadow-2xs ${className}`}>
          811
        </div>
      );
    case "PNB":
      return (
        <div className={`flex items-center justify-center rounded-lg bg-[#A20036] text-[#FFCC00] font-black text-[9px] shadow-2xs ${className}`}>
          PNB
        </div>
      );
    default:
      return (
        <div className={`flex items-center justify-center rounded-lg bg-slate-700 text-white font-black text-[9px] shadow-2xs ${className}`}>
          BANK
        </div>
      );
  }
}
