import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { productsAPI, categoriesAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function AddProduct() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    specifications: '',
    brand: '',
    color: '',
    size: '',
    price: '',
    discountPercent: '',
    categoryId: '',
    stockQuantity: '',
    lowStockThreshold: '5',
  })

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesAPI.getAll()
      setCategories(res.data || [])
    } catch {}
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.categoryId || !form.stockQuantity) {
      toast.error('Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      await productsAPI.create({
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
      toast.success('Product created successfully')
      navigate('/admin/products')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/products')} className="btn-secondary px-3 py-2">
          <ArrowLeft size={16} />
        </button>
        <h1 className="page-title">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="admin-card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Product Name <span className="text-danger">*</span>
              </label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Enter product name" className="admin-input" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Brand</label>
              <input type="text" value={form.brand} onChange={set('brand')} placeholder="e.g. NovaBrand" className="admin-input" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Category <span className="text-danger">*</span>
              </label>
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
              <input type="text" value={form.color} onChange={set('color')} placeholder="e.g. Black" className="admin-input" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Size</label>
              <input type="text" value={form.size} onChange={set('size')} placeholder="e.g. M, XL, One Size" className="admin-input" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea value={form.description} onChange={set('description')} placeholder="Product description…" rows={4} className="admin-input resize-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Specifications</label>
              <textarea value={form.specifications} onChange={set('specifications')} placeholder="Technical specifications, features…" rows={3} className="admin-input resize-none" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="admin-card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Pricing & Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Price (₹) <span className="text-danger">*</span>
              </label>
              <input type="number" value={form.price} onChange={set('price')} placeholder="0.00" min="0" step="0.01" className="admin-input" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Discount (%)</label>
              <input type="number" value={form.discountPercent} onChange={set('discountPercent')} placeholder="0" min="0" max="100" step="0.01" className="admin-input" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Stock Quantity <span className="text-danger">*</span>
              </label>
              <input type="number" value={form.stockQuantity} onChange={set('stockQuantity')} placeholder="0" min="0" className="admin-input" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Low Stock Threshold</label>
              <input type="number" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} placeholder="5" min="1" className="admin-input" />
            </div>
          </div>
        </div>

        {/* Note about images */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
          <strong>Note:</strong> Product images can be added via the Seller portal or by uploading directly to Cloudinary. Image upload via admin panel requires a backend upload endpoint.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</> : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
