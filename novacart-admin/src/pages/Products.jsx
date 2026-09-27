import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, Edit, Trash2, Package, ChevronDown, RefreshCw } from 'lucide-react'
import { productsAPI, categoriesAPI } from '../services/api'
import StatusBadge from '../components/ui/StatusBadge'
import Pagination from '../components/ui/Pagination'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { SkeletonRow } from '../components/ui/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function Products() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState(searchParams.get('search') || searchParams.get('keyword') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoryId') || '')
  const [stockFilter, setStockFilter] = useState(searchParams.get('stock') || '')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const PAGE_SIZE = 20

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('keyword')
    if (q !== null && q !== search) setSearch(q)
    const cat = searchParams.get('categoryId')
    if (cat !== null && cat !== categoryFilter) setCategoryFilter(cat)
    const st = searchParams.get('stock')
    if (st !== null && st !== stockFilter) setStockFilter(st)
  }, [searchParams])

  const fetchProducts = useCallback(async (p = 0) => {
    setLoading(true)
    try {
      const params = { page: p, size: PAGE_SIZE }
      if (search) params.keyword = search
      if (categoryFilter) params.categoryId = categoryFilter
      const res = await productsAPI.getAll(params)
      const data = res.data
      let content = data.content || []
      if (stockFilter === 'OUT_OF_STOCK') content = content.filter((p) => !p.inStock)
      else if (stockFilter === 'LOW_STOCK') content = content.filter((p) => p.inStock && p.stockQuantity <= 5)
      else if (stockFilter === 'IN_STOCK') content = content.filter((p) => p.inStock && p.stockQuantity > 5)
      setProducts(content)
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
    } catch {
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, stockFilter])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesAPI.getAll()
      setCategories(res.data || [])
    } catch {}
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(0), 400)
    setPage(0)
    return () => clearTimeout(timer)
  }, [search, categoryFilter, stockFilter, fetchProducts])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await productsAPI.delete(deleteTarget.id)
      toast.success('Product deleted')
      setDeleteTarget(null)
      fetchProducts(page)
    } catch {
      toast.error('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  const stockStatus = (p) => {
    if (!p.inStock || p.stockQuantity <= 0) return 'OUT_OF_STOCK'
    if (p.stockQuantity <= 5) return 'LOW_STOCK'
    return 'IN_STOCK'
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalElements} products in database</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-admin-bg border border-admin-border rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={15} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <div className="relative">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="admin-input appearance-none pr-9 min-w-[160px] cursor-pointer">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="admin-input appearance-none pr-9 min-w-[150px] cursor-pointer">
            <option value="">All Stock</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <button onClick={() => fetchProducts(page)} className="btn-secondary px-3">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                : products.length === 0
                ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        title="No products found"
                        description="Try adjusting your filters or add a new product"
                        action={<Link to="/admin/products/new" className="btn-primary"><Plus size={15} /> Add Product</Link>}
                      />
                    </td>
                  </tr>
                )
                : products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-admin-bg border border-admin-border">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={16} className="text-slate-600" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-slate-200 truncate max-w-[200px]">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.brand}</p>
                    </td>
                    <td className="text-slate-400 text-xs">{product.categoryName}</td>
                    <td className="font-semibold text-slate-200">₹{Number(product.price).toLocaleString()}</td>
                    <td className="text-emerald-400 text-sm">
                      {product.discountPercent > 0 ? `${product.discountPercent}%` : '—'}
                    </td>
                    <td>
                      <span className="text-sm text-slate-300">{product.stockQuantity ?? 0}</span>
                    </td>
                    <td>
                      <StatusBadge status={stockStatus(product)} />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                          className="p-1.5 rounded-lg hover:bg-nova-500/20 text-slate-400 hover:text-nova-400 transition-colors"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="p-1.5 rounded-lg hover:bg-danger/20 text-slate-400 hover:text-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-admin-border">
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); fetchProducts(p) }} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete Product'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
