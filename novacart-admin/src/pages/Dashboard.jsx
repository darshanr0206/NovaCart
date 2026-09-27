import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, DollarSign, Users, Package,
  Clock, RefreshCw, CheckCircle, AlertTriangle,
  Eye, TrendingUp,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { dashboardAPI, ordersAPI, MOCK_ANALYTICS } from '../services/api'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import { SkeletonRow } from '../components/ui/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-admin-card border border-admin-border rounded-xl px-3 py-2 text-sm shadow-card">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)

  const fetchData = useCallback(async () => {
    setLoadingStats(true)
    setLoadingOrders(true)
    try {
      const [statsResult, ordersResult] = await Promise.allSettled([
        dashboardAPI.getStats(),
        ordersAPI.getAll(0, 8),
      ])
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data)
      }
      if (ordersResult.status === 'fulfilled') {
        setRecentOrders(ordersResult.value.data?.content || [])
      }
      if (statsResult.status === 'rejected' && ordersResult.status === 'rejected') {
        toast.error('Failed to load dashboard data')
      }
    } catch (err) {
      toast.error('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoadingStats(false)
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const topStats = [
    { title: 'Total Orders', value: stats?.totalOrders !== undefined ? stats.totalOrders.toLocaleString() : '—', icon: ShoppingBag, color: 'nova', to: '/admin/orders' },
    { title: 'New Orders', value: stats?.newOrders !== undefined ? stats.newOrders.toLocaleString() : '—', icon: Clock, color: 'info', to: '/admin/orders?status=PLACED' },
    { title: 'New Customers', value: (stats?.newCustomers ?? stats?.totalCustomers) !== undefined ? (stats?.newCustomers ?? stats?.totalCustomers).toLocaleString() : '—', icon: Users, color: 'success', to: '/admin/customers' },
    { title: 'Total Products', value: stats?.totalProducts !== undefined ? stats.totalProducts.toLocaleString() : '—', icon: Package, color: 'warning', to: '/admin/products' },
  ]

  const secondaryStats = [
    { title: 'Pending Returns', value: stats?.pendingReturns !== undefined ? stats.pendingReturns.toLocaleString() : '0', icon: AlertTriangle, color: 'danger', to: '/admin/returns?status=RETURN_REQUESTED' },
    { title: 'Pending Approvals', value: stats?.pendingSellerApprovals !== undefined ? stats.pendingSellerApprovals.toLocaleString() : '0', icon: Clock, color: 'warning', to: '/admin/orders' },
    { title: 'Active Deliveries', value: stats?.activeDeliveries !== undefined ? stats.activeDeliveries.toLocaleString() : '0', icon: RefreshCw, color: 'info', to: '/admin/orders?status=OUT_FOR_DELIVERY' },
    { title: 'Delivered Orders', value: stats?.deliveredOrders !== undefined ? stats.deliveredOrders.toLocaleString() : '—', icon: CheckCircle, color: 'success', to: '/admin/orders?status=DELIVERED' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {topStats.map((s) => (
          <StatCard key={s.title} {...s} loading={loadingStats} />
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {secondaryStats.map((s) => (
          <StatCard key={s.title} {...s} loading={loadingStats} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Overview */}
        <div className="admin-card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Link to="/admin/analytics" className="text-sm font-semibold text-slate-100 hover:text-nova-400 transition-colors flex items-center gap-1.5">
                Revenue Overview <TrendingUp size={14} className="text-nova-400" />
              </Link>
              <p className="text-xs text-slate-500 mt-0.5">Monthly revenue breakdown</p>
            </div>
            <Link to="/admin/analytics" className="text-xs text-nova-400 hover:text-nova-300 font-medium">
              View Analytics →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_ANALYTICS.monthlyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252D3D" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Link to="/admin/categories" className="text-sm font-semibold text-slate-100 hover:text-nova-400 transition-colors">
                Sales by Category
              </Link>
              <p className="text-xs text-slate-500 mt-0.5">Category distribution</p>
            </div>
            <Link to="/admin/categories" className="text-xs text-nova-400 hover:text-nova-300 font-medium">
              Manage →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={MOCK_ANALYTICS.categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {MOCK_ANALYTICS.categoryBreakdown.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #252D3D', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {MOCK_ANALYTICS.categoryBreakdown.map((item, i) => (
              <Link to="/admin/categories" key={item.name} className="flex items-center justify-between text-xs hover:bg-admin-hover/40 p-1 rounded transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="text-slate-300 font-medium">{item.value}%</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Orders chart */}
      <div className="admin-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <Link to="/admin/orders" className="text-sm font-semibold text-slate-100 hover:text-nova-400 transition-colors">
              Orders Overview
            </Link>
            <p className="text-xs text-slate-500 mt-0.5">Monthly order metrics</p>
          </div>
          <Link to="/admin/orders" className="text-xs text-nova-400 hover:text-nova-300 font-medium">
            View All Orders →
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={MOCK_ANALYTICS.monthlyOrders} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252D3D" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="orders" name="orders" fill="#7C3AED" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="admin-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
          <h2 className="text-sm font-semibold text-slate-100">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-nova-400 hover:text-nova-300 font-medium flex items-center gap-1">
            View all <Eye size={13} />
          </Link>
        </div>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                : recentOrders.length === 0
                ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState title="No orders yet" description="Orders will appear here as customers place them" />
                    </td>
                  </tr>
                )
                : recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-nova-400 text-xs">#{order.orderNumber || order.id}</td>
                    <td className="font-medium text-slate-200">{order.customerName || '—'}</td>
                    <td>{order.items?.length ?? 0}</td>
                    <td className="font-semibold">₹{Number(order.total || 0).toLocaleString()}</td>
                    <td><StatusBadge status={order.paymentStatus || order.payment?.status} /></td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="text-slate-500 text-xs whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <Link
                        to={`/admin/orders/${order.id}`}
                        state={{ order }}
                        className="text-xs text-nova-400 hover:text-nova-300 font-medium flex items-center gap-1"
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
      </div>
    </div>
  )
}
