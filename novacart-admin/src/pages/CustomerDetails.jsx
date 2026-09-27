import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, ShoppingBag, DollarSign, Calendar, Package, MapPin, Eye } from 'lucide-react'
import { customersAPI } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import { SkeletonText } from '../components/ui/SkeletonLoader'
import toast from 'react-hot-toast'

export default function CustomerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initialCustomer = location.state?.customer

  const [customer, setCustomer] = useState(initialCustomer || null)
  const [loading, setLoading] = useState(!initialCustomer)

  const fetchCustomer = useCallback(async () => {
    if (!customer) setLoading(true)
    try {
      const decodedId = decodeURIComponent(id)
      const res = await customersAPI.getById(decodedId)
      setCustomer(res.data)
    } catch {
      if (!customer) {
        toast.error('Customer not found')
      }
    } finally {
      setLoading(false)
    }
  }, [id, customer])

  useEffect(() => {
    fetchCustomer()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-24 h-8 bg-admin-border rounded-xl animate-pulse-subtle" />
          <div className="w-40 h-6 bg-admin-border rounded animate-pulse-subtle" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="admin-card p-5"><SkeletonText lines={6} /></div>
          <div className="lg:col-span-2 admin-card p-5"><SkeletonText lines={6} /></div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="admin-card p-12 text-center max-w-lg mx-auto space-y-4">
        <p className="text-slate-400">Customer account not found.</p>
        <button onClick={() => navigate('/admin/customers')} className="btn-secondary">← Back to Customers</button>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/customers')} className="btn-secondary px-3 py-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title">{customer.fullName}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Customer Profile & Order History</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="admin-card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-nova-600/20 border-2 border-nova-600/40 flex items-center justify-center text-3xl font-bold text-nova-400 mb-4">
            {customer.fullName?.charAt(0) || 'C'}
          </div>
          <h2 className="text-lg font-bold text-slate-100">{customer.fullName}</h2>
          <div className="mt-1">
            <StatusBadge status={customer.active ? 'ACTIVE' : 'INACTIVE'} />
          </div>

          <div className="mt-6 w-full space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={15} className="text-slate-500 shrink-0" />
              <span className="text-slate-300 truncate">{customer.email || '—'}</span>
            </div>
            {customer.phone && customer.phone !== '—' && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={15} className="text-slate-500 shrink-0" />
                <span className="text-slate-300">{customer.phone}</span>
              </div>
            )}
            {customer.deliveryAddress && customer.deliveryAddress !== '—' && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={15} className="text-slate-500 shrink-0 mt-0.5" />
                <span className="text-slate-400 text-xs leading-relaxed">{customer.deliveryAddress}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={15} className="text-slate-500 shrink-0" />
              <span className="text-slate-400 text-xs">
                Active since {customer.joinedAt ? new Date(customer.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats & Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="admin-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-nova-500/10 border border-nova-500/20 flex items-center justify-center">
                  <ShoppingBag size={16} className="text-nova-400" />
                </div>
                <p className="text-sm text-slate-400">Total Orders</p>
              </div>
              <p className="text-3xl font-bold text-slate-100">{customer.totalOrders}</p>
            </div>
            <div className="admin-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <DollarSign size={16} className="text-emerald-400" />
                </div>
                <p className="text-sm text-slate-400">Total Spent</p>
              </div>
              <p className="text-3xl font-bold text-slate-100">₹{customer.totalSpent?.toLocaleString() || 0}</p>
            </div>
          </div>

          {/* Orders list */}
          <div className="admin-card overflow-hidden">
            <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Order History ({customer.orders?.length || 0})</h3>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-xs text-nova-400 hover:text-nova-300 font-medium"
              >
                All Orders →
              </button>
            </div>

            {customer.orders && customer.orders.length > 0 ? (
              <div className="divide-y divide-admin-border/40">
                {customer.orders.map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-admin-hover/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-nova-400">#{order.orderNumber || order.id}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-slate-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        {' • '}
                        {order.items?.length || 1} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-100">₹{Number(order.total || 0).toLocaleString()}</span>
                      <Link
                        to={`/admin/orders/${order.id}`}
                        state={{ order }}
                        className="btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1"
                      >
                        <Eye size={12} /> View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No orders recorded for this customer yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
