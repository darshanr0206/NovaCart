import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Menu,
  ChevronLeft,
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  ShieldCheck,
  ShoppingBag,
  RotateCcw,
  Package,
  ExternalLink,
  ChevronDown,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
  '/admin/products/new': 'Add Product',
  '/admin/categories': 'Categories',
  '/admin/inventory': 'Inventory',
  '/admin/customers': 'Customers',
  '/admin/payments': 'Payments',
  '/admin/returns': 'Returns',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
}

export default function Topbar({ collapsed, setCollapsed, setMobileOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, logout } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const title =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.includes('/orders/')
      ? 'Order Details'
      : location.pathname.includes('/products/') && location.pathname.includes('/edit')
      ? 'Edit Product'
      : location.pathname.includes('/customers/')
      ? 'Customer Details'
      : 'Admin')

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    // Default search to products with keyword
    navigate(`/admin/products?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <header className="h-16 bg-admin-surface border-b border-admin-border flex items-center px-4 gap-4 shrink-0 relative z-30">
      {/* Sidebar toggle — desktop */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl hover:bg-admin-hover text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Sidebar toggle — mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-admin-hover text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-slate-100">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 bg-admin-bg border border-admin-border rounded-xl px-3 py-2 w-56 lg:w-72 focus-within:border-nova-500/60 transition-colors">
        <Search size={15} className="text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search products or orders…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-slate-500 hover:text-slate-300"
          >
            <X size={13} />
          </button>
        )}
      </form>

      {/* Notifications Button & Dropdown */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            setShowNotifications(!showNotifications)
            setShowProfileMenu(false)
          }}
          className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors cursor-pointer ${
            showNotifications
              ? 'bg-nova-600/20 text-nova-300'
              : 'hover:bg-admin-hover text-slate-400 hover:text-slate-200'
          }`}
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-nova-500 rounded-full animate-pulse" />
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-admin-surface border border-admin-border rounded-2xl shadow-2xl p-4 text-xs z-50 animate-fade-in">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-admin-border">
              <span className="font-bold text-slate-200 text-sm">Notifications</span>
              <span className="text-[10px] text-nova-400 bg-nova-500/10 px-2 py-0.5 rounded-full font-semibold">
                Live Feed
              </span>
            </div>

            <div className="space-y-2.5">
              <Link
                to="/admin/orders"
                onClick={() => setShowNotifications(false)}
                className="flex items-start gap-3 p-2 rounded-xl hover:bg-admin-hover/60 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <ShoppingBag size={15} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200 group-hover:text-nova-300 transition-colors">
                    New orders placed
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Check order queue & status updates</p>
                </div>
              </Link>

              <Link
                to="/admin/returns"
                onClick={() => setShowNotifications(false)}
                className="flex items-start gap-3 p-2 rounded-xl hover:bg-admin-hover/60 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <RotateCcw size={15} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                    Return requests pending
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Review customer return claims</p>
                </div>
              </Link>

              <Link
                to="/admin/inventory"
                onClick={() => setShowNotifications(false)}
                className="flex items-start gap-3 p-2 rounded-xl hover:bg-admin-hover/60 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Package size={15} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">
                    Inventory Status
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Verify stock & catalog health</p>
                </div>
              </Link>
            </div>

            <div className="pt-3 mt-2 border-t border-admin-border text-center">
              <Link
                to="/admin/orders"
                onClick={() => setShowNotifications(false)}
                className="text-nova-400 hover:text-nova-300 font-medium text-xs inline-flex items-center gap-1"
              >
                View all store activity →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Admin Profile Dropdown & Quick Actions */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => {
            setShowProfileMenu(!showProfileMenu)
            setShowNotifications(false)
          }}
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-admin-hover/80 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-nova-600/30 border border-nova-600/50 flex items-center justify-center">
            <span className="text-nova-400 text-xs font-bold">
              {admin?.fullName?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">
              {admin?.fullName || 'Admin User'}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">Super Administrator</p>
          </div>
          <ChevronDown size={14} className="hidden sm:block text-slate-500" />
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-64 bg-admin-surface border border-admin-border rounded-2xl shadow-2xl p-3 text-xs z-50 animate-fade-in">
            <div className="px-3 py-2 border-b border-admin-border mb-2">
              <p className="font-bold text-slate-200 text-sm">{admin?.fullName || 'System Admin'}</p>
              <p className="text-slate-400 text-xs truncate">{admin?.email}</p>
              <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full uppercase">
                {admin?.roles?.[0]?.replace('ROLE_', '') || 'ADMIN'}
              </span>
            </div>

            <div className="space-y-1">
              <Link
                to="/admin/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-admin-hover transition-colors font-medium"
              >
                <User size={15} className="text-slate-400" />
                <span>Admin Profile</span>
              </Link>

              <Link
                to="/admin/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-admin-hover transition-colors font-medium"
              >
                <Settings size={15} className="text-slate-400" />
                <span>Portal Settings</span>
              </Link>
            </div>

            <div className="pt-2 mt-2 border-t border-admin-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-medium cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
