import React, { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', confirmClass = 'btn-danger', onConfirm, onCancel }) {
  useEffect(() => {
    if (open) {
      const handleKey = (e) => { if (e.key === 'Escape') onCancel() }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative admin-card p-6 w-full max-w-md animate-fade-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-admin-hover text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-100 mb-1">{title}</h3>
            <p className="text-sm text-slate-400">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className={confirmClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
