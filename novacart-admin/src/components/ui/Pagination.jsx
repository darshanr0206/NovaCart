import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  for (let i = Math.max(0, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                   hover:bg-admin-hover hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {pages[0] > 0 && (
        <>
          <button onClick={() => onPageChange(0)} className="w-8 h-8 rounded-lg text-sm text-slate-400 hover:bg-admin-hover hover:text-slate-200 transition-colors">
            1
          </button>
          {pages[0] > 1 && <span className="text-slate-600 px-1">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
            ${p === page
              ? 'bg-nova-600 text-white'
              : 'text-slate-400 hover:bg-admin-hover hover:text-slate-200'
            }`}
        >
          {p + 1}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages - 1 && (
        <>
          {pages[pages.length - 1] < totalPages - 2 && <span className="text-slate-600 px-1">…</span>}
          <button onClick={() => onPageChange(totalPages - 1)} className="w-8 h-8 rounded-lg text-sm text-slate-400 hover:bg-admin-hover hover:text-slate-200 transition-colors">
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                   hover:bg-admin-hover hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
