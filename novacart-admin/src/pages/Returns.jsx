import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  RotateCcw, Check, X, DollarSign, RefreshCw, AlertCircle,
  PackageCheck, Search, Filter, MessageSquare, CreditCard,
  CheckCircle2, Clock
} from 'lucide-react'
import { returnsAPI } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function Returns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Action comment modal state
  const [activeModal, setActiveModal] = useState(null) // { returnItem, targetStatus, title }
  const [adminComment, setAdminComment] = useState('')

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

  const executeStatusUpdate = async (id, newStatus, comment = '') => {
    setUpdatingId(id)
    try {
      const res = await returnsAPI.updateStatus(id, newStatus, comment)
      const updated = res.data
      setReturns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated, status: newStatus, adminComment: comment || updated.adminComment } : r))
      )
      toast.success(`Return request marked as ${newStatus.replace(/_/g, ' ').toLowerCase()}`)
      setActiveModal(null)
      setAdminComment('')
    } catch (err) {
      console.error('Failed to update return status:', err)
      toast.error(err.response?.data?.message || 'Failed to update return status')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const matchesSearch =
        !searchQuery.trim() ||
        String(r.id).includes(searchQuery.trim()) ||
        (r.orderNumber && r.orderNumber.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        (r.orderId && String(r.orderId).includes(searchQuery.trim())) ||
        (r.customer && r.customer.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        (r.customerEmail && r.customerEmail.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        (r.product && r.product.toLowerCase().includes(searchQuery.toLowerCase().trim()))

      const matchesStatus =
        statusFilter === 'ALL' || r.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [returns, searchQuery, statusFilter])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Returns & Refund Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {returns.length} return request{returns.length === 1 ? '' : 's'} recorded in database
          </p>
        </div>
        <button
          onClick={fetchReturns}
          disabled={loading}
          className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh Database
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Return ID, Order #, Customer, or Product…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-9 text-xs w-full"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Returns' },
            { id: 'RETURN_REQUESTED', label: 'Pending Review' },
            { id: 'RETURN_APPROVED', label: 'Approved' },
            { id: 'RETURNED', label: 'Received' },
            { id: 'REFUNDED', label: 'Refunded' },
            { id: 'RETURN_REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-nova-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
                <th>Reason & Notes</th>
                <th>Amount & Mode</th>
                <th>Return Status</th>
                <th>Refund Tracking</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-nova-500 mb-2" />
                    Loading returns from database…
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      icon={RotateCcw}
                      title="No return requests found"
                      description={
                        searchQuery || statusFilter !== 'ALL'
                          ? 'No return requests matched your search or status filter.'
                          : 'When customers request returns for delivered orders, they will appear here in real time.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs text-slate-500 font-semibold">#{r.id}</td>
                    <td className="font-mono text-xs">
                      <Link
                        to={`/admin/orders/${r.orderId || ''}`}
                        className="text-nova-400 hover:text-nova-300 font-bold underline-offset-2 hover:underline"
                        title="View Full Order Details"
                      >
                        #{r.orderNumber || r.orderId}
                      </Link>
                    </td>
                    <td>
                      <div className="font-medium text-slate-200">{r.customer}</div>
                      {r.customerEmail && (
                        <div className="text-xs text-slate-500 font-mono">{r.customerEmail}</div>
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
                      {r.adminComment && (
                        <div className="text-[11px] text-amber-400/90 mt-0.5 truncate" title={`Admin note: ${r.adminComment}`}>
                          Admin: {r.adminComment}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="font-semibold text-slate-100">
                        ₹{Number(r.amount || 0).toLocaleString()}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {r.paymentMethod || 'COD'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-xs">
                      {r.refundStatus ? (
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.refundStatus === 'COMPLETED'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : r.refundStatus === 'INITIATED' || r.refundStatus === 'IN_PROGRESS'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : r.refundStatus === 'REJECTED'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {r.refundStatus}
                          </span>
                          {r.refundTransactionId && (
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]" title={r.refundTransactionId}>
                              {r.refundTransactionId}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="text-slate-500 text-xs whitespace-nowrap font-mono">
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
                              onClick={() => {
                                setActiveModal({
                                  returnItem: r,
                                  targetStatus: 'RETURN_APPROVED',
                                  title: 'Approve Return Request',
                                })
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-500/30"
                              title="Approve return request"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setActiveModal({
                                  returnItem: r,
                                  targetStatus: 'RETURN_REJECTED',
                                  title: 'Reject Return Request',
                                })
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors border border-red-500/30"
                              title="Reject return request"
                            >
                              <X size={13} /> Reject
                            </button>
                          </>
                        ) : r.status === 'RETURN_APPROVED' ? (
                          <>
                            <button
                              onClick={() => executeStatusUpdate(r.id, 'RETURNED')}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 text-xs font-medium flex items-center gap-1 transition-colors border border-sky-500/30"
                              title="Mark item as physically returned / received"
                            >
                              <PackageCheck size={13} /> Received
                            </button>
                            <button
                              onClick={() => {
                                setActiveModal({
                                  returnItem: r,
                                  targetStatus: 'REFUNDED',
                                  title: 'Process & Complete Refund',
                                })
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-500/30"
                              title="Mark as Refunded"
                            >
                              <DollarSign size={13} /> Refund
                            </button>
                          </>
                        ) : r.status === 'RETURNED' ? (
                          <button
                            onClick={() => {
                              setActiveModal({
                                returnItem: r,
                                targetStatus: 'REFUNDED',
                                title: 'Process & Complete Refund',
                              })
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-500/30"
                            title="Mark as Refunded"
                          >
                            <DollarSign size={13} /> Refund
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Completed</span>
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

      {/* Admin Action Modal */}
      {activeModal && (
        <div
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">{activeModal.title}</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                <strong>Order:</strong> #{activeModal.returnItem.orderNumber || activeModal.returnItem.orderId}
              </p>
              <p>
                <strong>Customer:</strong> {activeModal.returnItem.customer} ({activeModal.returnItem.customerEmail})
              </p>
              <p>
                <strong>Refund Amount:</strong> ₹{Number(activeModal.returnItem.amount || 0).toLocaleString()} (Mode: {activeModal.returnItem.paymentMethod || 'COD'})
              </p>
              <p>
                <strong>Reason:</strong> {activeModal.returnItem.reason}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Admin Comment / Note to Customer <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Add any verification note, tracking ID or instructions…"
                rows={3}
                className="admin-input w-full text-xs"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  executeStatusUpdate(
                    activeModal.returnItem.id,
                    activeModal.targetStatus,
                    adminComment
                  )
                }
                className={`btn-primary text-xs px-4 py-1.5 ${
                  activeModal.targetStatus === 'RETURN_REJECTED'
                    ? '!bg-rose-600 hover:!bg-rose-500'
                    : ''
                }`}
              >
                Confirm {activeModal.targetStatus.replace(/_/g, ' ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
