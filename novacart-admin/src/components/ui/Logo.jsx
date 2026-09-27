import React from 'react'

export default function Logo({
  className = '',
  showTagline = true,
  tagline = 'Many sellers. One cart.',
  showAdminBadge = false,
  variant = 'light', // 'light' (for light background) | 'dark' (for dark background)
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  const iconSize = size === 'lg' ? 'w-12 h-12 rounded-[16px]' : size === 'sm' ? 'w-8 h-8 rounded-[11px]' : 'w-10 h-10 rounded-[14px]'
  const starSize = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const textClass = size === 'lg' ? 'text-2xl sm:text-3xl font-black' : size === 'sm' ? 'text-lg font-black' : 'text-xl sm:text-2xl font-black'
  const taglineClass = size === 'lg' ? 'text-xs' : 'text-[11px]'

  const isDark = variant === 'dark'

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Black Squircle Icon Container with Lavender/Purple 4-pointed Star */}
      <div
        className={`grid ${iconSize} place-items-center bg-[#111116] ring-1 ${
          isDark ? 'ring-white/10 shadow-lg shadow-purple-950/40' : 'ring-black/5 shadow-sm'
        } shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`${starSize} fill-[#A78BFA]`}
        >
          <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
        </svg>
      </div>

      {/* Brand Wordmark + Tagline */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 leading-none">
          <span className={`tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} ${textClass}`}>
            Nova<span className="text-[#7C3AED]">Cart</span>
          </span>

          {showAdminBadge && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-purple-500/15 border border-purple-400/30 text-purple-400 rounded-md">
              Admin
            </span>
          )}
        </div>

        {showTagline && (
          <p
            className={`mt-1 font-medium tracking-tight ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            } ${taglineClass}`}
          >
            {tagline}
          </p>
        )}
      </div>
    </div>
  )
}
