import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Tag, Edit2, Trash2, X, Check } from 'lucide-react'
import { categoriesAPI } from '../services/api'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/SkeletonLoader'
import toast from 'react-hot-toast'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await categoriesAPI.getAll()
      setCategories(res.data || [])
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) { toast.error('Category name is required'); return }
    setCreating(true)
    try {
      await categoriesAPI.create(newName.trim(), newDesc.trim() || undefined)
      toast.success('Category created')
      setNewName('')
      setNewDesc('')
      setShowAdd(false)
      fetchCategories()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create category')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">{categories.length} categories</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Add category form */}
      {showAdd && (
        <div className="admin-card p-5 animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">New Category</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Electronics"
                className="admin-input"
                autoFocus
                required
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Optional description…"
                className="admin-input"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary px-3">
                <X size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                : categories.length === 0
                ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={Tag}
                        title="No categories yet"
                        description="Add your first product category"
                        action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> Add Category</button>}
                      />
                    </td>
                  </tr>
                )
                : categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="text-slate-500 text-xs font-mono">#{cat.id}</td>
                    <td className="font-semibold text-slate-200">{cat.name}</td>
                    <td className="font-mono text-xs text-nova-400">{cat.slug}</td>
                    <td className="text-slate-400 text-sm max-w-xs truncate">{cat.description || '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {/* Edit & Delete require backend endpoints (PUT/DELETE /api/categories/:id) */}
                        <button
                          disabled
                          className="p-1.5 rounded-lg text-slate-600 cursor-not-allowed"
                          title="Edit — Backend API required (PUT /api/categories/:id)"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          disabled
                          className="p-1.5 rounded-lg text-slate-600 cursor-not-allowed"
                          title="Delete — Backend API required (DELETE /api/categories/:id)"
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
      </div>

      {/* Backend notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
        ⚠️ <strong>Backend API Required:</strong> Category edit and delete require <code className="bg-amber-500/20 px-1 rounded text-xs">PUT /api/categories/:id</code> and <code className="bg-amber-500/20 px-1 rounded text-xs">DELETE /api/categories/:id</code> endpoints to be added to the backend.
      </div>
    </div>
  )
}
