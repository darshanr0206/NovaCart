import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Filter, Eye, RefreshCw, ChevronDown } from 'lucide-react'
import { ordersAPI } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import Pagination from '../components/ui/Pagination'
import { SkeletonRow } from '../components/ui/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

const ORDER_STATUSES = ['PLACED','CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','RETURN_REQUESTED','RETURN_APPROVED','RETURNED','REFUNDED']

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [paymentFilter, setPaymentFilter] = useState('')
  const PAGE_SIZE = 50

  useEffect(() => {
    const urlStatus = searchParams.get('status')
    if (urlStatus) {
      setStatusFilter(urlStatus)
    }
  }, [searchParams])

  const fetchOrders = useCallback(async (p = 0, currentStatus = statusFilter, currentPayment = paymentFilter, currentSearch = search) => {
    setLoading(true)
    try {
      const res = await ordersAPI.getAll(p, PAGE_SIZE, {
        status: currentStatus || undefined,
        paymentStatus: currentPayment || undefined,
        search: currentSearch || undefined,
      })
      const data = res.data
      setOrders(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
    } catch {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, paymentFilter, search])

  useEffect(() => { fetchOrders(page) }, [page, fetchOrders])

  const handleStatusChange = (val) => {
    setStatusFilter(val)
    setPage(0)
    if (val) {
      setSearchParams({ status: val })
    } else {
      setSearchParams({})
    }
    fetchOrders(0, val, paymentFilter, search)
  }

  const handlePaymentChange = (val) => {
    setPaymentFilter(val)
    setPage(0)
    fetchOrders(0, statusFilter, val, search)
  }

  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(0)
  }

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      String(o.id).includes(q)
    const matchStatus = !statusFilter || o.status === statusFilter

    const rawPayment = (o.payment?.status || o.paymentStatus || (o.status === 'DELIVERED' ? 'SUCCESS' : o.status === 'CANCELLED' ? 'FAILED' : 'PENDING')).toUpperCase()

    let matchPayment = true
    if (paymentFilter) {
      const filterUpper = paymentFilter.toUpperCase()
      if (filterUpper === 'UNPAID') {
        matchPayment = rawPayment === 'PENDING' || rawPayment === 'UNPAID'
      } else {
        matchPayment = rawPayment === filterUpper
      }
    }
    return matchSearch && matchStatus && matchPayment
  })

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalElements} total orders</p>
        </div>
        <button onClick={() => fetchOrders(page)} className="btn-secondary">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-admin-bg border border-admin-border rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search order ID, customer, email…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        {/* Order Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="admin-input pr-9 appearance-none min-w-[160px] cursor-pointer"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {/* Payment Status filter */}
        <div className="relative">
          <select
            value={paymentFilter}
            onChange={(e) => handlePaymentChange(e.target.value)}
            className="admin-input pr-9 appearance-none min-w-[160px] cursor-pointer"
          >
            <option value="">All Payments</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="UNPAID">Unpaid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        title="No orders found"
                        description={search || statusFilter || paymentFilter ? 'Try adjusting your filters' : 'Orders will appear here as customers place them'}
                      />
                    </td>
                  </tr>
                )
                : filtered.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-nova-400 text-xs font-semibold">
                      #{order.orderNumber || order.id}
                    </td>
                    <td>
                      <p className="font-medium text-slate-200">{order.customerName || '—'}</p>
                      <p className="text-xs text-slate-500">{order.customerEmail || ''}</p>
                    </td>
                    <td className="text-slate-300">{order.items?.length ?? 0} item(s)</td>
                    <td className="font-semibold text-slate-100">₹{Number(order.total || 0).toLocaleString()}</td>
                    <td><StatusBadge status={order.payment?.status || order.paymentStatus || (order.status === 'DELIVERED' ? 'SUCCESS' : order.status === 'CANCELLED' ? 'FAILED' : 'PENDING')} /></td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="text-slate-500 text-xs whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <Link
                        to={`/admin/orders/${order.id}`}
                        state={{ order }}
                        className="inline-flex items-center gap-1 text-xs text-nova-400 hover:text-nova-300 font-medium bg-nova-500/10 hover:bg-nova-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye size={13} /> View
                      </Link>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-admin-border">
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchOrders(p) }} />
          </div>
        )}
      </div>
    </div>
  )
}
