import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, Users, RefreshCw } from 'lucide-react'
import { customersAPI } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/SkeletonLoader'
import toast from 'react-hot-toast'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await customersAPI.getAll()
      setCustomers(res.data || [])
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    const matchStatus = !statusFilter ||
      (statusFilter === 'ACTIVE' ? c.active : !c.active)
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} registered customers from database</p>
        </div>
        <button onClick={fetchCustomers} className="btn-secondary">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-admin-bg border border-admin-border rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-input min-w-[140px]">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon={Users} title="No customers found" description="Try adjusting your search" />
                    </td>
                  </tr>
                )
                : filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nova-600/20 border border-nova-600/30 flex items-center justify-center text-nova-400 text-xs font-bold shrink-0">
                          {c.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-200">{c.fullName}</span>
                      </div>
                    </td>
                    <td className="text-slate-400 text-sm">{c.phone || '—'}</td>
                    <td className="text-slate-400 text-sm">{c.email || '—'}</td>
                    <td className="text-slate-300 font-semibold">{c.totalOrders}</td>
                    <td className="font-semibold text-slate-200">₹{c.totalSpent.toLocaleString()}</td>
                    <td className="text-slate-500 text-xs">
                      {c.joinedAt ? new Date(c.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td><StatusBadge status={c.active ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td>
                      <Link
                        to={`/admin/customers/${encodeURIComponent(c.id)}`}
                        state={{ customer: c }}
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
      </div>
    </div>
  )
}
