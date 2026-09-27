import React from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'nova',
  loading = false,
  to,
  onClick,
}) {
  const colorMap = {
    nova: 'text-nova-400 bg-nova-500/10 border-nova-500/20',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    danger: 'text-red-400 bg-red-500/10 border-red-500/20',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }

  if (loading) {
    return (
      <div className="admin-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-32 h-3 bg-admin-border rounded animate-pulse-subtle" />
          <div className="w-10 h-10 bg-admin-border rounded-xl animate-pulse-subtle" />
        </div>
        <div className="w-24 h-7 bg-admin-border rounded animate-pulse-subtle mb-2" />
        <div className="w-20 h-3 bg-admin-border rounded animate-pulse-subtle" />
      </div>
    )
  }

  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-slate-400 font-medium group-hover:text-slate-200 transition-colors">{title}</p>
          {to && <ArrowUpRight size={13} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${colorMap[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className="stat-number mb-1.5 font-mono">{value ?? '—'}</p>
      {trendLabel && (
        <div className="flex items-center gap-1">
          {trend > 0 ? (
            <TrendingUp size={13} className="text-emerald-400" />
          ) : trend < 0 ? (
            <TrendingDown size={13} className="text-red-400" />
          ) : null}
          <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-500'}`}>
            {trendLabel}
          </span>
        </div>
      )}
    </>
  )

  const cardClasses = `admin-card p-5 transition-all duration-200 block ${
    to || onClick
      ? 'group cursor-pointer hover:border-nova-500/40 hover:bg-admin-hover/40 active:scale-[0.99]'
      : ''
  }`

  if (to) {
    return (
      <Link to={to} className={cardClasses}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <div onClick={onClick} className={cardClasses}>
        {content}
      </div>
    )
  }

  return <div className={cardClasses}>{content}</div>
}
