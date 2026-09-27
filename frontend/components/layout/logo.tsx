import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      {/* Black Squircle Icon Container with Lavender 4-pointed Star */}
      <span
        className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-[14px] sm:rounded-[16px] bg-[#111116] text-[#A78BFA] transition duration-300 group-hover:scale-105 shadow-xs shrink-0"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 sm:h-5.5 sm:w-5.5 fill-[#A78BFA] transition-transform duration-300 group-hover:rotate-12"
        >
          <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
        </svg>
      </span>

      {/* Brand Wordmark: Nova (black) + Cart (purple) */}
      {!iconOnly && (
        <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-ink leading-none">
          Nova<span className="text-[#7C3AED]">Cart</span>
        </span>
      )}
    </Link>
  );
}
