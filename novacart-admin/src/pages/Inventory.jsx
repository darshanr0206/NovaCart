import React, { useState, useEffect, useCallback } from 'react'
import { Search, Package, Edit2, RefreshCw, ChevronDown, Check, X } from 'lucide-react'
import { productsAPI } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import Pagination from '../components/ui/Pagination'
import { SkeletonRow } from '../components/ui/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editStock, setEditStock] = useState('')
  const [saving, setSaving] = useState(false)
  const PAGE_SIZE = 25

  const fetchInventory = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const params = { page: p, size: PAGE_SIZE }
      if (search) params.keyword = search
      const res = await productsAPI.getAll(params)
      const data = res.data
      let content = data.content || []
      if (stockFilter === 'OUT_OF_STOCK') content = content.filter((p) => !p.inStock || p.stockQuantity <= 0)
      else if (stockFilter === 'LOW_STOCK') content = content.filter((p) => p.inStock && p.stockQuantity > 0 && p.stockQuantity <= 5)
      else if (stockFilter === 'IN_STOCK') content = content.filter((p) => p.inStock && p.stockQuantity > 5)
      setProducts(content)
      setTotalPages(data.totalPages || 0)
    } catch {
      toast.error('Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }, [search, stockFilter])

  useEffect(() => {
    const t = setTimeout(() => fetchInventory(0), 400)
    setPage(0)
    return () => clearTimeout(t)
  }, [search, stockFilter, fetchInventory])

  const startEdit = (product) => {
    setEditingId(product.id)
    setEditStock(String(product.stockQuantity ?? 0))
  }

  const saveStock = async (productId) => {
    setSaving(true)
    try {
      // Update via product update endpoint (stock is part of ProductRequest)
      const product = products.find((p) => p.id === productId)
      await productsAPI.update(productId, {
        name: product.name,
        description: product.description,
        specifications: product.specifications,
        brand: product.brand,
        price: product.price,
        discountPercent: product.discountPercent || 0,
        categoryId: product.categoryId,
        stockQuantity: Number(editStock),
        lowStockThreshold: 5,
      })
      toast.success('Stock updated')
      setEditingId(null)
      fetchInventory(page)
    } catch {
      toast.error('Failed to update stock')
    } finally {
      setSaving(false)
    }
  }

  const stockStatus = (p) => {
    if (!p.inStock || p.stockQuantity <= 0) return 'OUT_OF_STOCK'
    if (p.stockQuantity <= 5) return 'LOW_STOCK'
    return 'IN_STOCK'
  }

  const rowHighlight = (p) => {
    if (!p.inStock || p.stockQuantity <= 0) return 'bg-red-500/5 border-l-2 border-l-red-500/40'
    if (p.stockQuantity <= 5) return 'bg-yellow-500/5 border-l-2 border-l-yellow-500/40'
    return ''
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and update product stock levels</p>
        </div>
        <button onClick={() => fetchInventory(page)} className="btn-secondary">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In Stock', value: products.filter((p) => p.inStock && p.stockQuantity > 5).length, color: 'text-emerald-400' },
          { label: 'Low Stock', value: products.filter((p) => p.inStock && p.stockQuantity > 0 && p.stockQuantity <= 5).length, color: 'text-yellow-400' },
          { label: 'Out of Stock', value: products.filter((p) => !p.inStock || p.stockQuantity <= 0).length, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="admin-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-admin-bg border border-admin-border rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-slate-500 shrink-0" />
          <input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full" />
        </div>
        <div className="relative">
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="admin-input appearance-none pr-9 min-w-[160px] cursor-pointer">
            <option value="">All Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
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
                <th>Product</th>
                <th>Category</th>
                <th>SKU / ID</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                : products.length === 0
                ? (
                  <tr><td colSpan={6}><EmptyState icon={Package} title="No products found" description="Try adjusting your filters" /></td></tr>
                )
                : products.map((product) => (
                  <tr key={product.id} className={rowHighlight(product)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-admin-bg border border-admin-border overflow-hidden shrink-0">
                          {product.images?.[0]
                            ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-slate-600" /></div>
                          }
                        </div>
                        <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{product.name}</p>
                      </div>
                    </td>
                    <td className="text-slate-400 text-xs">{product.categoryName}</td>
                    <td className="font-mono text-xs text-slate-500">#{product.id}</td>
                    <td>
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-20 bg-admin-bg border border-nova-500/50 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none"
                          min="0"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-semibold text-slate-200">{product.stockQuantity ?? 0}</span>
                      )}
                    </td>
                    <td><StatusBadge status={stockStatus(product)} /></td>
                    <td>
                      {editingId === product.id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => saveStock(product.id)} disabled={saving} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-admin-hover text-slate-500 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(product)} className="p-1.5 rounded-lg hover:bg-nova-500/20 text-slate-400 hover:text-nova-400 transition-colors">
                          <Edit2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-admin-border">
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchInventory(p) }} />
          </div>
        )}
      </div>
    </div>
  )
}
