import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Toaster } from "sonner";

const display = Manrope({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "800"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "NovaCart — Many Sellers. One Cart.",
  description: "Shop products from trusted sellers, all in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 w-full">{children}</main>
        <SiteFooter />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
