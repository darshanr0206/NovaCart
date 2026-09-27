"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface PaymentQrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function PaymentQrCode({ value, size = 160, className = "" }: PaymentQrCodeProps) {
  return (
    <div className={`relative flex items-center justify-center p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin={false}
        className="w-full h-auto max-w-[170px]"
      />
    </div>
  );
}
