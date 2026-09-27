import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import Products from './pages/Products'
import AddProduct from './pages/AddProduct'
import EditProduct from './pages/EditProduct'
import Categories from './pages/Categories'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import CustomerDetails from './pages/CustomerDetails'
import Payments from './pages/Payments'
import Returns from './pages/Returns'
import Coupons from './pages/Coupons'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

// Layout
import AdminLayout from './components/layout/AdminLayout'

// ─── Protected route wrapper ──────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-nova-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading NovaCart Admin…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

// ─── Public route (redirect if already logged in) ────────────────────────────
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-nova-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Public */}
      <Route
        path="/admin/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected admin routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:orderId" element={<OrderDetails />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<AddProduct />} />
        <Route path="products/:id/edit" element={<EditProduct />} />
        <Route path="categories" element={<Categories />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="payments" element={<Payments />} />
        <Route path="returns" element={<Returns />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
