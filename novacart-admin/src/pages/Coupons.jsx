import React, { useState, useEffect, useMemo } from 'react'
import {
  Ticket, Plus, Edit2, Trash2, RefreshCw, Check, X,
  Percent, DollarSign, Calendar, Clock, AlertCircle,
  Search, ToggleLeft, ToggleRight, Tag
} from 'lucide-react'
import { couponsAPI } from '../services/api'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Create/Edit Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '',
    maxDiscountAmount: '',
    expiryDate: '',
    usageLimit: '',
    active: true,
  })

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await couponsAPI.getAll()
      setCoupons(res.data || [])
    } catch (err) {
      console.error('Failed to fetch coupons:', err)
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const openCreateModal = () => {
    setEditingCoupon(null)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const defaultExpiry = futureDate.toISOString().slice(0, 16)

    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderValue: '',
      maxDiscountAmount: '',
      expiryDate: defaultExpiry,
      usageLimit: '',
      active: true,
    })
    setModalOpen(true)
  }

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon)
    let expiryIso = ''
    if (coupon.expiryDate) {
      try {
        expiryIso = new Date(coupon.expiryDate).toISOString().slice(0, 16)
      } catch {
        expiryIso = coupon.expiryDate.slice(0, 16)
      }
    }

    setFormData({
      code: coupon.code,
      discountType: coupon.discountType || 'PERCENTAGE',
      discountValue: String(coupon.discountValue || coupon.discountPercent || ''),
      minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : '',
      maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '',
      expiryDate: expiryIso,
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      active: Boolean(coupon.active),
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.code.trim()) {
      toast.error('Coupon code is required')
      return
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error('Valid discount value is required')
      return
    }
    if (!formData.expiryDate) {
      toast.error('Expiry date is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        expiryDate: new Date(formData.expiryDate).toISOString(),
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        active: Boolean(formData.active),
      }

      if (editingCoupon) {
        const res = await couponsAPI.update(editingCoupon.id, payload)
        toast.success(`Coupon ${payload.code} updated successfully`)
        setCoupons((prev) => prev.map((c) => (c.id === editingCoupon.id ? res.data : c)))
      } else {
        const res = await couponsAPI.create(payload)
        toast.success(`Coupon ${payload.code} created successfully`)
        setCoupons((prev) => [res.data, ...prev])
      }
      setModalOpen(false)
    } catch (err) {
      console.error('Coupon save error:', err)
      toast.error(err.response?.data?.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (coupon) => {
    setTogglingId(coupon.id)
    try {
      const res = await couponsAPI.toggle(coupon.id)
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? res.data : c)))
      toast.success(`Coupon ${coupon.code} is now ${res.data.active ? 'Active' : 'Inactive'}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) {
      return
    }
    setDeletingId(coupon.id)
    try {
      await couponsAPI.delete(coupon.id)
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id))
      toast.success(`Coupon ${coupon.code} deleted`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        String(c.id).includes(searchQuery.trim())

      const isExpired = c.expired || (c.expiryDate && new Date(c.expiryDate) < new Date())
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? c.active && !isExpired
          : statusFilter === 'INACTIVE'
          ? !c.active
          : statusFilter === 'EXPIRED'
          ? isExpired
          : true

      return matchesSearch && matchesStatus
    })
  }, [coupons, searchQuery, statusFilter])

  // Top metric counts
  const stats = useMemo(() => {
    const total = coupons.length
    const active = coupons.filter((c) => c.active && (!c.expiryDate || new Date(c.expiryDate) >= new Date())).length
    const expired = coupons.filter((c) => c.expiryDate && new Date(c.expiryDate) < new Date()).length
    const totalRedeemed = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)
    return { total, active, expired, totalRedeemed }
  }, [coupons])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Coupons & Promotions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create and manage promotional discount codes for customer checkout
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchCoupons}
            disabled={loading}
            className="btn-secondary text-xs px-3 py-2 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="admin-card p-4">
          <span className="text-xs font-medium text-slate-400">Total Coupons</span>
          <p className="text-2xl font-bold text-slate-100 mt-1">{stats.total}</p>
        </div>
        <div className="admin-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs font-medium text-slate-400">Active Promotions</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
        </div>
        <div className="admin-card p-4 border-l-4 border-l-rose-500">
          <span className="text-xs font-medium text-slate-400">Expired Coupons</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{stats.expired}</p>
        </div>
        <div className="admin-card p-4 border-l-4 border-l-indigo-500">
          <span className="text-xs font-medium text-slate-400">Total Redeemed</span>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{stats.totalRedeemed}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search coupons by code or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input pl-9 text-xs w-full"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Coupons' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'INACTIVE', label: 'Inactive' },
            { id: 'EXPIRED', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-nova-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount Type & Value</th>
                <th>Min Order</th>
                <th>Max Discount</th>
                <th>Usage & Limits</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-nova-500 mb-2" />
                    Loading coupons from database…
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={Ticket}
                      title="No coupons found"
                      description="Create promotional coupons to offer discounts on customer checkout."
                    />
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExpired = c.expired || (c.expiryDate && new Date(c.expiryDate) < new Date())
                  const isLimitReached = c.usageLimit && c.usedCount >= c.usageLimit

                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Tag size={15} className="text-nova-400" />
                          <span className="font-mono font-bold text-slate-100 text-sm tracking-wide bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/70">
                            {c.code}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {c.discountType === 'PERCENTAGE' ? (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs font-bold">
                              {c.discountValue || c.discountPercent}% OFF
                            </span>
                          ) : (
                            <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-xs font-bold">
                              ₹{Number(c.discountValue || 0).toLocaleString()} FLAT OFF
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-slate-300 text-xs">
                        {c.minOrderValue ? `₹${Number(c.minOrderValue).toLocaleString()}` : 'No minimum'}
                      </td>
                      <td className="text-slate-300 text-xs">
                        {c.maxDiscountAmount ? `₹${Number(c.maxDiscountAmount).toLocaleString()}` : 'No cap'}
                      </td>
                      <td>
                        <div className="text-xs">
                          <span className="font-bold text-slate-200">{c.usedCount || 0}</span>
                          <span className="text-slate-500">
                            {' '}/ {c.usageLimit ? c.usageLimit : '∞'} used
                          </span>
                          {c.usageLimit && (
                            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  isLimitReached ? 'bg-rose-500' : 'bg-nova-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, ((c.usedCount || 0) / c.usageLimit) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-xs font-mono">
                        {c.expiryDate ? (
                          <div className={isExpired ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                            {new Date(c.expiryDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-500">Never</span>
                        )}
                      </td>
                      <td>
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Expired
                          </span>
                        ) : isLimitReached ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Limit Reached
                          </span>
                        ) : c.active ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700/60 text-slate-400 border border-slate-600">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggle(c)}
                            disabled={togglingId === c.id}
                            className={`p-1.5 rounded-lg border transition ${
                              c.active
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                            title={c.active ? 'Deactivate coupon' : 'Activate coupon'}
                          >
                            {togglingId === c.id ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : c.active ? (
                              <ToggleRight size={16} />
                            ) : (
                              <ToggleLeft size={16} />
                            )}
                          </button>

                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 border border-slate-700 transition"
                            title="Edit coupon"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => handleDelete(c)}
                            disabled={deletingId === c.id}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                            title="Delete coupon"
                          >
                            {deletingId === c.id ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div
          onClick={() => !saving && setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-nova-500" />
                <h3 className="text-base font-bold text-slate-100">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Code */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Coupon Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME50, FESTIVE10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="admin-input uppercase font-mono font-bold tracking-wider"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Discount Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="admin-input"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Discount Value <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                      required
                      placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g. 15 (for 15%)' : 'e.g. 150 (for ₹150)'}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="admin-input"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                      {formData.discountType === 'PERCENTAGE' ? '%' : '₹'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Min Order Value & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Min Order Value (₹) <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 500"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Max Discount Cap (₹) <span className="text-slate-500 font-normal">(Optional for %)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 200"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Expiry Date & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Expiry Date & Time <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="admin-input font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Usage Limit <span className="text-slate-500 font-normal">(Optional total uses)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100 (leave blank for unlimited)"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-800 text-nova-600 focus:ring-0"
                  />
                  <span className="text-slate-200 font-medium">Coupon is Active and available for use</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="btn-secondary text-xs px-3.5 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <span>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
