import React from 'react'

export function SkeletonRow({ cols = 6 }) {
  return (
    <tr className="border-b border-admin-border/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-admin-border rounded animate-pulse-subtle" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="admin-card p-5 space-y-3">
      <div className="h-3 bg-admin-border rounded w-1/3 animate-pulse-subtle" />
      <div className="h-7 bg-admin-border rounded w-1/2 animate-pulse-subtle" />
      <div className="h-2.5 bg-admin-border rounded w-1/4 animate-pulse-subtle" />
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-admin-border rounded animate-pulse-subtle"
          style={{ width: `${50 + (i % 3) * 20}%` }}
        />
      ))}
    </div>
  )
}
