import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, CreditCard, RefreshCw } from 'lucide-react'
import { paymentsAPI } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/SkeletonLoader'
import toast from 'react-hot-toast'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentsAPI.getAll()
      setPayments(res.data || [])
    } catch {
      toast.error('Failed to load payment transactions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      String(p.orderId).toLowerCase().includes(q) ||
      String(p.customer).toLowerCase().includes(q) ||
      String(p.transactionId).toLowerCase().includes(q) ||
      String(p.customerEmail || '').toLowerCase().includes(q)
    const matchStatus = !statusFilter || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const total = filtered.reduce((sum, p) => sum + (p.status === 'SUCCESS' ? p.amount : 0), 0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">{payments.length} transactions from PostgreSQL orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchPayments} className="btn-secondary">
            <RefreshCw size={15} /> Refresh
          </button>
          <div className="admin-card px-4 py-2 text-sm">
            <span className="text-slate-400">Confirmed Revenue: </span>
            <span className="font-bold text-emerald-400">₹{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-admin-bg border border-admin-border rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search order, customer, email, or transaction ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-input min-w-[150px]">
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon={CreditCard} title="No payments found" description="Transactions will appear here when orders are placed" />
                    </td>
                  </tr>
                )
                : filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-slate-500">#{p.id}</td>
                    <td className="font-mono text-xs">
                      <Link
                        to={`/admin/orders/${p.orderDbId || p.id}`}
                        className="text-nova-400 hover:text-nova-300 font-semibold underline-offset-2 hover:underline"
                      >
                        {p.orderId}
                      </Link>
                    </td>
                    <td>
                      <p className="font-medium text-slate-200">{p.customer}</p>
                      {p.customerEmail && <p className="text-xs text-slate-500">{p.customerEmail}</p>}
                    </td>
                    <td className="font-semibold text-slate-100">₹{p.amount.toLocaleString()}</td>
                    <td className="text-slate-400 text-sm">{p.method}</td>
                    <td className="font-mono text-xs text-slate-500 max-w-[160px] truncate" title={p.transactionId}>
                      {p.transactionId}
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-slate-500 text-xs whitespace-nowrap">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
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
