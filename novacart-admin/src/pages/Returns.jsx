import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, Check, X, DollarSign } from 'lucide-react'
import { MOCK_RETURNS } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

// ⚠️ MOCK DATA — Backend API Required: GET /api/admin/returns, PATCH /api/admin/returns/:id/status

export default function Returns() {
  const [returns, setReturns] = useState(MOCK_RETURNS)

  const updateStatus = (id, newStatus) => {
    setReturns((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r))
    toast.success(`Return ${newStatus.replace(/_/g, ' ').toLowerCase()}`)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Returns & Refunds</h1>
          <p className="text-sm text-slate-500 mt-0.5">{returns.length} return requests</p>
        </div>
      </div>

      {/* Mock data notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
        ⚠️ <strong>Mock Data:</strong> Backend API Required — <code className="bg-amber-500/20 px-1 rounded">GET /api/admin/returns</code> and <code className="bg-amber-500/20 px-1 rounded">PATCH /api/admin/returns/:id/status</code>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.length === 0
                ? <tr><td colSpan={9}><EmptyState icon={RotateCcw} title="No return requests" description="Return requests will appear here" /></td></tr>
                : returns.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-slate-500">#{r.id}</td>
                    <td className="font-mono text-xs">
                      <Link to="/admin/orders" className="text-nova-400 hover:text-nova-300 font-semibold underline-offset-2 hover:underline">
                        {r.orderId}
                      </Link>
                    </td>
                    <td className="font-medium text-slate-200">{r.customer}</td>
                    <td className="text-slate-300 text-sm max-w-[160px] truncate">{r.product}</td>
                    <td className="text-slate-400 text-sm max-w-[200px] truncate">{r.reason}</td>
                    <td className="font-semibold text-slate-200">₹{r.amount.toLocaleString()}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-slate-500 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {r.status === 'RETURN_REQUESTED' && (
                          <>
                            <button
                              onClick={() => updateStatus(r.id, 'RETURN_APPROVED')}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, 'CANCELLED')}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        {r.status === 'RETURN_APPROVED' && (
                          <button
                            onClick={() => updateStatus(r.id, 'REFUNDED')}
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                            title="Mark as Refunded"
                          >
                            <DollarSign size={13} /> Refund
                          </button>
                        )}
                        {(r.status === 'REFUNDED' || r.status === 'CANCELLED') && (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
