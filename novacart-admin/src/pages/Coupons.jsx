import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Tag, Ticket, Edit2, Trash2, X, Check, Calendar, AlertCircle } from 'lucide-react'
import { couponsAPI } from '../services/api'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/SkeletonLoader'
import toast from 'react-hot-toast'

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form fields
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('PERCENTAGE')
  const [discountPercent, setDiscountPercent] = useState('')
  const [fixedDiscountAmount, setFixedDiscountAmount] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [active, setActive] = useState(true)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await couponsAPI.getAll()
      setCoupons(res.data || [])
    } catch {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const openCreateModal = () => {
    setEditingCoupon(null)
    setCode('')
    setDiscountType('PERCENTAGE')
    setDiscountPercent('10')
    setFixedDiscountAmount('')
    setMinOrderValue('')
    setMaxDiscountAmount('')
    setUsageLimit('')
    // Default expiry 30 days ahead
    const date = new Date()
    date.setDate(date.getDate() + 30)
    setExpiryDate(date.toISOString().split('T')[0] + 'T23:59')
    setActive(true)
    setShowModal(true)
  }

  const openEditModal = (c) => {
    setEditingCoupon(c)
    setCode(c.code)
    setDiscountType(c.discountType || 'PERCENTAGE')
    setDiscountPercent(c.discountPercent ? String(c.discountPercent) : '')
    setFixedDiscountAmount(c.fixedDiscountAmount ? String(c.fixedDiscountAmount) : '')
    setMinOrderValue(c.minOrderValue ? String(c.minOrderValue) : '')
    setMaxDiscountAmount(c.maxDiscountAmount ? String(c.maxDiscountAmount) : '')
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : '')
    setExpiryDate(c.expiryDate ? c.expiryDate.substring(0, 16) : '')
    setActive(c.active !== false)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      toast.error('Coupon code is required')
      return
    }
    if (!expiryDate) {
      toast.error('Expiry date is required')
      return
    }

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountPercent: discountType === 'PERCENTAGE' && discountPercent ? parseFloat(discountPercent) : null,
      fixedDiscountAmount: discountType === 'FIXED' && fixedDiscountAmount ? parseFloat(fixedDiscountAmount) : null,
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
      expiryDate: expiryDate.length === 16 ? expiryDate + ':00' : expiryDate,
      active,
    }

    setSaving(true)
    try {
      if (editingCoupon) {
        await couponsAPI.update(editingCoupon.id, payload)
        toast.success(`Coupon ${payload.code} updated`)
      } else {
        await couponsAPI.create(payload)
        toast.success(`Coupon ${payload.code} created`)
      }
      setShowModal(false)
      fetchCoupons()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save coupon')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await couponsAPI.delete(deleteTarget.id)
      toast.success('Coupon deleted')
      setDeleteTarget(null)
      fetchCoupons()
    } catch {
      toast.error('Failed to delete coupon')
    }
  }

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '—'
    return `₹${Number(val).toLocaleString('en-IN')}`
  }

  const formatDate = (val) => {
    if (!val) return '—'
    const d = new Date(val)
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Coupons & Discounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">{coupons.length} promotional coupons</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-admin-border bg-[#111116] text-xs font-semibold text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Min. Order</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Usage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/50 text-slate-300">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} cols={8} />
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      icon={Ticket}
                      title="No coupons yet"
                      description="Create your first coupon code to offer discounts to customers during checkout."
                    />
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = new Date(c.expiryDate) < new Date()
                  return (
                    <tr key={c.id} className="hover:bg-admin-hover/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-violet-400 text-sm tracking-wide">
                        {c.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {c.discountType === 'FIXED' ? 'Flat Amount' : 'Percentage'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-100">
                        {c.discountType === 'FIXED'
                          ? `₹${Number(c.fixedDiscountAmount || 0).toLocaleString('en-IN')}`
                          : `${c.discountPercent || 0}%`}
                        {c.maxDiscountAmount && c.discountType === 'PERCENTAGE' && (
                          <span className="text-xs text-slate-500 block">Up to ₹{c.maxDiscountAmount}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {c.minOrderValue ? formatCurrency(c.minOrderValue) : 'No min.'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs ${isExpired ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                          {formatDate(c.expiryDate)}
                          {isExpired && ' (Expired)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {c.usageCount || 0} / {c.usageLimit != null ? c.usageLimit : '∞'}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.active && !isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Edit Coupon"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 size={15} />
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

      {/* Modal: Create/Edit Coupon */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181f] border border-admin-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
              <h2 className="text-base font-semibold text-white">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE50, FLAT200"
                  required
                  className="admin-input font-mono font-bold tracking-wider uppercase"
                />
              </div>

              {/* Discount Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Discount Type *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="admin-input"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>

                {/* Amount / Percent */}
                {discountType === 'PERCENTAGE' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Discount Percentage (%) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      placeholder="e.g. 15"
                      required
                      className="admin-input"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Fixed Discount (₹) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={fixedDiscountAmount}
                      onChange={(e) => setFixedDiscountAmount(e.target.value)}
                      placeholder="e.g. 200"
                      required
                      className="admin-input"
                    />
                  </div>
                )}
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Min. Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="e.g. 500 (Optional)"
                    className="admin-input"
                  />
                </div>
                {discountType === 'PERCENTAGE' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      placeholder="e.g. 1000 (Optional)"
                      className="admin-input"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      placeholder="e.g. 100 uses"
                      className="admin-input"
                    />
                  </div>
                )}
              </div>

              {discountType === 'PERCENTAGE' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Usage Limit (Total times can be used)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="e.g. 100 (Leave blank for unlimited)"
                    className="admin-input"
                  />
                </div>
              )}

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Expiry Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                  className="admin-input"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="coupon-active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="coupon-active" className="text-sm text-slate-200 cursor-pointer">
                  Coupon is active and redeemable by customers
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-admin-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving…' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon "${deleteTarget?.code}"? Customers will no longer be able to use it.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
