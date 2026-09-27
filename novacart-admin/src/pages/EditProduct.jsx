import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { productsAPI, categoriesAPI } from '../services/api'
import { SkeletonText } from '../components/ui/SkeletonLoader'
import toast from 'react-hot-toast'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [productRes, catRes] = await Promise.all([
        productsAPI.getById(id),
        categoriesAPI.getAll(),
      ])
      const p = productRes.data
      setForm({
        name: p.name || '',
        description: p.description || '',
        specifications: p.specifications || '',
        brand: p.brand || '',
        color: p.color || '',
        size: p.size || '',
        price: p.price || '',
        discountPercent: p.discountPercent || '',
        categoryId: p.categoryId || '',
        stockQuantity: p.stockQuantity || '',
        lowStockThreshold: '5',
      })
      setCategories(catRes.data || [])
    } catch {
      toast.error('Failed to load product')
      navigate('/admin/products')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetchData() }, [fetchData])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await productsAPI.update(id, {
        name: form.name.trim(),
        description: form.description,
        specifications: form.specifications,
        brand: form.brand,
        color: form.color,
        size: form.size,
        price: Number(form.price),
        discountPercent: Number(form.discountPercent) || 0,
        categoryId: Number(form.categoryId),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
      })
      toast.success('Product updated successfully')
      navigate('/admin/products')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-20 h-8 bg-admin-border rounded-xl animate-pulse-subtle" />
          <div className="w-40 h-6 bg-admin-border rounded animate-pulse-subtle" />
        </div>
        <div className="admin-card p-5"><SkeletonText lines={8} /></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/products')} className="btn-secondary px-3 py-2">
          <ArrowLeft size={16} />
        </button>
        <h1 className="page-title">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="admin-card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Product Name <span className="text-danger">*</span></label>
              <input type="text" value={form.name} onChange={set('name')} className="admin-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Brand</label>
              <input type="text" value={form.brand} onChange={set('brand')} className="admin-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Category <span className="text-danger">*</span></label>
              <div className="relative">
                <select value={form.categoryId} onChange={set('categoryId')} className="admin-input appearance-none pr-9 cursor-pointer" required>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Color</label>
              <input type="text" value={form.color} onChange={set('color')} className="admin-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Size</label>
              <input type="text" value={form.size} onChange={set('size')} className="admin-input" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={4} className="admin-input resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Specifications</label>
              <textarea value={form.specifications} onChange={set('specifications')} rows={3} className="admin-input resize-none" />
            </div>
          </div>
        </div>

        <div className="admin-card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Pricing & Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Price (₹) <span className="text-danger">*</span></label>
              <input type="number" value={form.price} onChange={set('price')} min="0" step="0.01" className="admin-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Discount (%)</label>
              <input type="number" value={form.discountPercent} onChange={set('discountPercent')} min="0" max="100" step="0.01" className="admin-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Stock Quantity <span className="text-danger">*</span></label>
              <input type="number" value={form.stockQuantity} onChange={set('stockQuantity')} min="0" className="admin-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Low Stock Threshold</label>
              <input type="number" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} min="1" className="admin-input" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
