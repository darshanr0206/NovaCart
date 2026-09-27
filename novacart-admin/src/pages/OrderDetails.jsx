import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Phone, Mail, Package,
  CreditCard, CheckCircle2, Clock, Truck,
  RefreshCw, ChevronDown, AlertCircle,
} from 'lucide-react'
import { ordersAPI } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import { SkeletonText } from '../components/ui/SkeletonLoader'
import toast from 'react-hot-toast'

const ORDER_STATUSES = ['PLACED','CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED']

const TIMELINE_ICONS = {
  PLACED: Clock,
  CONFIRMED: CheckCircle2,
  PROCESSING: RefreshCw,
  PACKED: Package,
  SHIPPED: Truck,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: Clock,
}

export default function OrderDetails() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initialOrder = location.state?.order && (String(location.state.order.id) === String(orderId) || String(location.state.order.orderNumber) === String(orderId))
    ? location.state.order
    : null

  const [order, setOrder] = useState(initialOrder)
  const [loading, setLoading] = useState(!initialOrder)
  const [errorMessage, setErrorMessage] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(initialOrder?.status || '')

  const fetchOrder = useCallback(async () => {
    if (!order) setLoading(true)
    setErrorMessage(null)
    try {
      const res = await ordersAPI.getById(orderId)
      if (res?.data) {
        setOrder(res.data)
        setSelectedStatus(res.data.status)
      } else {
        setErrorMessage(`Order #${orderId} was not found in the database.`)
      }
    } catch (err) {
      console.error('Order fetch error:', err)
      const status = err?.response?.status
      if (status === 401) {
        setErrorMessage('Authentication session expired. Please log in again.')
      } else if (status === 403) {
        setErrorMessage('Admin access denied for this order resource.')
      } else if (status === 404) {
        setErrorMessage(`Order #${orderId} was not found in the database.`)
      } else if (err?.message?.includes('Network Error')) {
        setErrorMessage('Unable to connect to NovaCart backend service.')
      } else {
        setErrorMessage(err?.response?.data?.message || 'Failed to load order details.')
      }
      if (!order) {
        toast.error('Failed to load order details')
      }
    } finally {
      setLoading(false)
    }
  }, [orderId, order])

  useEffect(() => { fetchOrder() }, [orderId])

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === order?.status) return
    setUpdating(true)
    try {
      await ordersAPI.updateStatus(order.id, selectedStatus)
      toast.success(`Order status updated to ${selectedStatus.replace(/_/g, ' ')}`)
      setOrder((prev) => ({ ...prev, status: selectedStatus }))
      fetchOrder()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-24 h-8 bg-admin-border rounded-xl animate-pulse-subtle" />
          <div className="w-40 h-6 bg-admin-border rounded animate-pulse-subtle" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="admin-card p-5"><SkeletonText lines={4} /></div>
          ))}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="admin-card p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-200">Order Not Found</h2>
          <p className="text-sm text-slate-400 mt-1">{errorMessage || `Order #${orderId} could not be retrieved from PostgreSQL.`}</p>
        </div>
        <button onClick={() => navigate('/admin/orders')} className="btn-secondary">← Back to Orders</button>
      </div>
    )
  }

  const statusIndex = ORDER_STATUSES.indexOf(order.status)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/orders')} className="btn-secondary px-3 py-2">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Order #{order.orderNumber || order.id}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '—'}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} size="md" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: order info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer info */}
          <div className="admin-card p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-nova-600/20 border border-nova-600/30 flex items-center justify-center text-nova-400 text-sm font-bold">
                  {order.customerName?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{order.customerName || '—'}</p>
                  <p className="text-xs text-slate-500">Customer</p>
                </div>
              </div>
              {order.customerEmail && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail size={14} className="text-slate-500" />
                  {order.customerEmail}
                </div>
              )}
            </div>
          </div>

          {/* Delivery address */}
          <div className="admin-card p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <MapPin size={15} className="text-nova-400" /> Delivery Address
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">{order.deliveryAddress || '—'}</p>
          </div>

          {/* Products */}
          <div className="admin-card overflow-hidden">
            <div className="px-5 py-4 border-b border-admin-border">
              <h2 className="text-sm font-semibold text-slate-200">Order Items</h2>
            </div>
            <div className="divide-y divide-admin-border/50">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-admin-bg border border-admin-border flex items-center justify-center">
                      <Package size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.productName}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    ₹{Number(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Order totals */}
            <div className="px-5 py-4 border-t border-admin-border bg-admin-bg/30 space-y-2">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal || 0).toLocaleString()}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-emerald-400">
                  <span>Discount</span>
                  <span>-₹{Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-400">
                <span>Delivery Fee</span>
                <span>{Number(order.deliveryCharge) === 0 ? 'Free' : `₹${Number(order.deliveryCharge).toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-100 pt-2 border-t border-admin-border">
                <span>Total</span>
                <span>₹{Number(order.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: payment + status update */}
        <div className="space-y-4">
          {/* Payment info */}
          <div className="admin-card p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <CreditCard size={15} className="text-nova-400" /> Payment
            </h2>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={order.payment?.status || order.paymentStatus} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Method</span>
                <span className="text-slate-300">{order.paymentMethod || order.payment?.paymentMethod || '—'}</span>
              </div>
              {order.payment?.razorpayPaymentId && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Transaction</span>
                  <span className="text-slate-400 text-xs font-mono">{order.payment.razorpayPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-400">Amount</span>
                <span className="text-slate-100">₹{Number(order.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="admin-card p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Update Order Status</h2>
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="admin-input appearance-none pr-9 cursor-pointer"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || selectedStatus === order.status}
                className="btn-primary w-full justify-center"
              >
                {updating ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>

          {/* Order timeline */}
          <div className="admin-card p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Order Timeline</h2>
            <div className="space-y-3">
              {ORDER_STATUSES.slice(0, ORDER_STATUSES.length - 1).map((s, i) => {
                const Icon = TIMELINE_ICONS[s] || Clock
                const done = i <= statusIndex
                const current = s === order.status
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border
                      ${current ? 'bg-nova-600 border-nova-500 text-white' :
                        done ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                        'bg-admin-bg border-admin-border text-slate-600'}`}>
                      <Icon size={13} />
                    </div>
                    <span className={`text-xs font-medium ${current ? 'text-nova-300' : done ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {s.replace(/_/g, ' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
