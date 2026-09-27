import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../ui/Logo'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Boxes,
  Users,
  CreditCard,
  RotateCcw,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Store,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: Tag, label: 'Categories' },
  { to: '/admin/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/returns', icon: RotateCcw, label: 'Returns' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-admin-border shrink-0">
        {!collapsed && (
          <Logo
            variant="dark"
            size="sm"
            showAdminBadge={true}
            showTagline={true}
            tagline="Many sellers. One cart."
          />
        )}
        {collapsed && (
          <div className="w-9 h-9 grid place-items-center bg-[#111116] rounded-[11px] ring-1 ring-white/10 mx-auto">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#A78BFA]">
              <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
            </svg>
          </div>
        )}
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-admin-hover text-slate-400"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: admin profile + logout */}
      <div className="px-3 py-4 border-t border-admin-border space-y-1 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1">
            <div className="w-8 h-8 rounded-full bg-nova-600/30 border border-nova-600/50 flex items-center justify-center shrink-0">
              <span className="text-nova-400 text-xs font-bold">
                {admin?.fullName?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{admin?.fullName || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{admin?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`nav-link w-full text-danger hover:bg-danger/10 hover:text-danger ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-admin-surface border-r border-admin-border
                    transition-all duration-300 shrink-0
                    ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-admin-surface border-r border-admin-border
                    transition-transform duration-300
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
