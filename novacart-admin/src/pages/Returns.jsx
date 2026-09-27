import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, Check, X, DollarSign, RefreshCw, AlertCircle, PackageCheck } from 'lucide-react'
import { returnsAPI } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function Returns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchReturns = async () => {
    setLoading(true)
    try {
      const res = await returnsAPI.getAll()
      setReturns(res.data || [])
    } catch (err) {
      console.error('Failed to load returns:', err)
      toast.error('Failed to load return requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReturns()
  }, [])

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id)
    try {
      const res = await returnsAPI.updateStatus(id, newStatus)
      const updated = res.data
      setReturns((prev) => prev.map((r) => r.id === id ? { ...r, ...updated, status: newStatus } : r))
      toast.success(`Return request marked as ${newStatus.replace(/_/g, ' ').toLowerCase()}`)
    } catch (err) {
      console.error('Failed to update return status:', err)
      toast.error(err.response?.data?.message || 'Failed to update return status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Returns & Refunds</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {returns.length} return request{returns.length === 1 ? '' : 's'} in system
          </p>
        </div>
        <button
          onClick={fetchReturns}
          disabled={loading}
          className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
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
                <th>Reason & Note</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-nova-500 mb-2" />
                    Loading return requests…
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={RotateCcw}
                      title="No return requests"
                      description="When customers request a return for delivered orders, they will appear here."
                    />
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-slate-500">#{r.id}</td>
                    <td className="font-mono text-xs">
                      <Link
                        to={`/admin/orders/${r.orderId || ''}`}
                        className="text-nova-400 hover:text-nova-300 font-semibold underline-offset-2 hover:underline"
                      >
                        #{r.orderNumber || r.orderId}
                      </Link>
                    </td>
                    <td>
                      <div className="font-medium text-slate-200">{r.customer}</div>
                      {r.customerEmail && (
                        <div className="text-xs text-slate-500">{r.customerEmail}</div>
                      )}
                    </td>
                    <td className="text-slate-300 text-sm max-w-[180px] truncate" title={r.product}>
                      {r.product}
                    </td>
                    <td className="text-sm max-w-[220px]">
                      <div className="text-slate-200 font-medium truncate" title={r.reason}>
                        {r.reason}
                      </div>
                      {r.note && (
                        <div className="text-xs text-slate-400 italic truncate" title={r.note}>
                          &quot;{r.note}&quot;
                        </div>
                      )}
                    </td>
                    <td className="font-semibold text-slate-200 whitespace-nowrap">
                      ₹{Number(r.amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-slate-500 text-xs whitespace-nowrap">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {updatingId === r.id ? (
                          <RefreshCw size={14} className="animate-spin text-nova-400" />
                        ) : r.status === 'RETURN_REQUESTED' ? (
                          <>
                            <button
                              onClick={() => updateStatus(r.id, 'RETURN_APPROVED')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Approve return request"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, 'RETURN_REJECTED')}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Reject return request"
                            >
                              <X size={13} /> Reject
                            </button>
                          </>
                        ) : r.status === 'RETURN_APPROVED' ? (
                          <>
                            <button
                              onClick={() => updateStatus(r.id, 'RETURNED')}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Mark item as physically returned / received"
                            >
                              <PackageCheck size={13} /> Received
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, 'REFUNDED')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Mark as Refunded"
                            >
                              <DollarSign size={13} /> Refund
                            </button>
                          </>
                        ) : r.status === 'RETURNED' ? (
                          <button
                            onClick={() => updateStatus(r.id, 'REFUNDED')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1 transition-colors"
                            title="Mark as Refunded"
                          >
                            <DollarSign size={13} /> Refund
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
