import React from 'react'

const STATUS_STYLES = {
  // Order statuses
  PLACED:           'bg-slate-500/15 text-slate-300 border-slate-500/30',
  CONFIRMED:        'bg-blue-500/15 text-blue-300 border-blue-500/30',
  PROCESSING:       'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  PACKED:           'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  SHIPPED:          'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  OUT_FOR_DELIVERY: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  DELIVERED:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  CANCELLED:        'bg-red-500/15 text-red-300 border-red-500/30',
  RETURN_REQUESTED: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  RETURN_APPROVED:  'bg-teal-500/15 text-teal-300 border-teal-500/30',
  RETURNED:         'bg-slate-400/15 text-slate-300 border-slate-400/30',
  REFUNDED:         'bg-green-500/15 text-green-300 border-green-500/30',

  // Payment statuses
  SUCCESS:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PENDING:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  UNPAID:   'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  FAILED:   'bg-red-500/15 text-red-300 border-red-500/30',
  PAID:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',

  // Stock statuses
  IN_STOCK:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  LOW_STOCK:    'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  OUT_OF_STOCK: 'bg-red-500/15 text-red-300 border-red-500/30',

  // User statuses
  ACTIVE:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  INACTIVE: 'bg-slate-500/15 text-slate-400 border-slate-500/30',

  // Seller statuses
  APPROVED:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  REJECTED:  'bg-red-500/15 text-red-300 border-red-500/30',
  SUSPENDED: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
}

const STATUS_LABELS = {
  OUT_FOR_DELIVERY: 'Out for Delivery',
  RETURN_REQUESTED: 'Return Requested',
  RETURN_APPROVED:  'Return Approved',
  IN_STOCK:     'In Stock',
  LOW_STOCK:    'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
}

export default function StatusBadge({ status, size = 'sm' }) {
  if (!status) return null
  const style = STATUS_STYLES[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  const label = STATUS_LABELS[status] || status.replace(/_/g, ' ')
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span className={`badge border ${style} ${textSize} whitespace-nowrap`}>
      {label}
    </span>
  )
}
