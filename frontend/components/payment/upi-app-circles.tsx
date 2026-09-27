import React from "react";

export function GooglePayCircle({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-white shadow-2xs border border-slate-100 p-1 ${className}`} title="Google Pay">
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.1-5.2 3.1-8.9z" fill="#4285F4"/>
        <path d="M12 23c3.2 0 6-1.1 8-2.9l-3.9-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.2C3.3 20.4 7.4 23 12 23z" fill="#34A853"/>
        <path d="M5.3 13.2c-.2-.7-.4-1.5-.4-2.2 0-.8.2-1.5.4-2.2V5.6H1.3C.4 7.3 0 9.1 0 11s.4 3.7 1.3 5.4l4-3.2z" fill="#FBBC05"/>
        <path d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.4 0 3.3 2.6 1.3 6.6l4 3.2c.9-2.9 3.6-5 6.7-5z" fill="#EA4335"/>
      </svg>
    </div>
  );
}

export function PhonePeCircle({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-[#5f259f] shadow-2xs p-1 ${className}`} title="PhonePe">
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="#5F259F" />
        <path
          d="M8 5h6.5c1.2 0 2.2 1 2.2 2.2 0 1.2-1 2.2-2.2 2.2H10v3.5c0 .7-.6 1.2-1.2 1.2s-1.2-.5-1.2-1.2V5h.4z"
          fill="#FFFFFF"
        />
        <circle cx="11" cy="7.5" r="1.1" fill="#5F259F" />
        <path
          d="M12 11.5l3.8 5.2c.4.5.3 1.2-.2 1.6-.5.4-1.2.3-1.6-.2l-3.5-4.8 1.5-1.8z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}

export function PaytmCircle({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-[#002E6E] shadow-2xs p-0.5 ${className}`} title="Paytm">
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="#002E6E" />
        <text x="3.5" y="15" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="8" fill="#FFFFFF">Pay</text>
        <text x="14" y="15" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="8" fill="#00BAF2">tm</text>
      </svg>
    </div>
  );
}

export function BhimUpiCircle({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-[#0074E4] shadow-2xs p-1 ${className}`} title="BHIM UPI">
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="#0074E4" />
        <path d="M7 6l5 6-5 6V6z" fill="#00BAF2" />
        <path d="M13 6l5 6-5 6V6z" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
