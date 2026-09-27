import React, { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, Users, DollarSign, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { MOCK_ANALYTICS, ordersAPI, customersAPI } from '../services/api'

const PIE_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-admin-card border border-admin-border rounded-xl px-3 py-2 text-sm shadow-card">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'revenue' ? `₹${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [orders, setOrders] = useState([])
  const [customerCount, setCustomerCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordRes, custRes] = await Promise.all([
        ordersAPI.getAll(0, 100),
        customersAPI.getAll(),
      ])
      const ords = ordRes.data?.content || []
      setOrders(ords)
      setCustomerCount(custRes.data?.length || 0)
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const hasDbOrders = orders.length > 0
  const totalRevenue = hasDbOrders
    ? orders.reduce((s, o) => s + Number(o.total || 0), 0)
    : MOCK_ANALYTICS.monthlyRevenue.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = hasDbOrders
    ? orders.length
    : MOCK_ANALYTICS.monthlyOrders.reduce((s, d) => s + d.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Calculate top products from DB orders if available
  const topDbProducts = React.useMemo(() => {
    if (!hasDbOrders) return MOCK_ANALYTICS.topProducts
    const counts = {}
    orders.forEach((o) => {
      o.items?.forEach((item) => {
        const name = item.productName || 'Product'
        if (!counts[name]) counts[name] = { name, sales: 0, revenue: 0 }
        counts[name].sales += Number(item.quantity || 1)
        counts[name].revenue += Number(item.price || 0) * Number(item.quantity || 1)
      })
    })
    const list = Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    return list.length > 0 ? list : MOCK_ANALYTICS.topProducts
  }, [orders, hasDbOrders])

  const summaryCards = [
    { title: 'Total Revenue', value: `₹${Math.round(totalRevenue).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-nova-400 bg-nova-500/10 border-nova-500/20' },
    { title: 'Avg Order Value', value: `₹${Math.round(avgOrderValue).toLocaleString()}`, icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { title: 'Registered Customers', value: customerCount ? String(customerCount) : '—', icon: Users, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {hasDbOrders ? 'Live database performance metrics & trends' : 'Business performance overview (sample trends)'}
          </p>
        </div>
        <button onClick={loadData} className="btn-secondary">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <div key={s.title} className="admin-card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-slate-400">{s.title}</p>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${s.color}`}>
                <s.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-100">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="admin-card p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-5">Revenue Over Time</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MOCK_ANALYTICS.monthlyRevenue}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#252D3D" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#revGrad2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders chart */}
      <div className="admin-card p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-5">Orders Over Time</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={MOCK_ANALYTICS.monthlyOrders} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252D3D" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="orders" name="orders" fill="#3B82F6" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales by Category */}
        <div className="admin-card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Sales by Category</h2>
          <div className="flex items-center justify-center">
            <PieChart width={260} height={220}>
              <Pie data={MOCK_ANALYTICS.categoryBreakdown} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                {MOCK_ANALYTICS.categoryBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #252D3D', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {MOCK_ANALYTICS.categoryBreakdown.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="text-slate-400 truncate">{item.name}</span>
                <span className="text-slate-300 font-medium ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="admin-card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Best-selling Products</h2>
          <div className="space-y-3">
            {topDbProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 w-4 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{p.name}</p>
                  <div className="mt-1.5 h-1.5 bg-admin-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-nova-600"
                      style={{ width: `${topDbProducts[0]?.sales ? (p.sales / topDbProducts[0].sales) * 100 : 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-200">{p.sales} sold</p>
                  <p className="text-xs text-emerald-400">₹{(p.revenue / 1000).toFixed(0)}k</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
