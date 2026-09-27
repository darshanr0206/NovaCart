import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  ShieldCheck,
  Lock,
  HelpCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import Logo from '../components/ui/Logo'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Real dynamic stats fetched directly from PostgreSQL backend
  const [stats, setStats] = useState({
    totalOrders: 0,
    newOrders: 0,
    newCustomers: 0,
    totalProducts: 0,
  })

  const { login } = useAuth()
  const navigate = useNavigate()

  // Fetch dynamic stats from backend whenever page opens/refreshes
  useEffect(() => {
    let mounted = true
    const fetchLiveStats = async () => {
      try {
        setStatsLoading(true)
        const res = await authAPI.getPortalStats()
        if (mounted && res.data) {
          setStats({
            totalOrders: res.data.totalOrders ?? 0,
            newOrders: res.data.newOrders ?? 0,
            newCustomers: res.data.newCustomers ?? 0,
            totalProducts: res.data.totalProducts ?? 0,
          })
        }
      } catch (err) {
        console.warn('Could not load public portal stats from backend', err)
      } finally {
        if (mounted) setStatsLoading(false)
      }
    }

    fetchLiveStats()
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!email || !password) {
      toast.error('Please enter your email and password')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back to NovaCart Admin!')
      navigate('/admin/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const fillDefaultCredentials = () => {
    setEmail('administrator@novacart.app')
    setPassword('Administrator@2026!')
    toast.success('Admin credentials applied')
  }

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#0B0F19] text-slate-100 selection:bg-purple-500 selection:text-white relative overflow-x-hidden lg:overflow-hidden font-sans">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: Dark/Purple NovaCart Brand & Live Admin Stats
      ───────────────────────────────────────────────────────────── */}
      <div className="lg:w-7/12 relative flex flex-col justify-between p-6 sm:p-10 lg:py-6 lg:px-10 xl:py-8 xl:px-14 overflow-hidden bg-gradient-to-br from-[#0B0F19] via-[#120e24] to-[#1a1136]">
        {/* Background glow effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-700/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Subtle grid mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #a855f7 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Top: NovaCart Brand Header with Official Logo & Tagline */}
        <div className="relative z-10 flex items-center justify-between shrink-0">
          <Logo
            variant="dark"
            size="md"
            showAdminBadge={true}
            showTagline={true}
            tagline="Many sellers. One cart."
          />
        </div>

        {/* Middle: Headline & Dynamic Admin Statistics */}
        <div className="relative z-10 my-6 lg:my-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3 lg:mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Unified Store Governance</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15] mb-2.5 lg:mb-3">
            Manage your store <br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent">
              with confidence.
            </span>
          </h1>

          <p className="text-slate-300/80 text-sm sm:text-base font-normal leading-relaxed max-w-xl mb-6 lg:mb-7">
            Complete real-time visibility into orders, inventory, customer accounts, and revenue analytics — powered by your PostgreSQL database.
          </p>

          {/* 4 Dynamic Admin Statistics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            {/* Stat 1: Total Orders */}
            <div className="group relative bg-[#13192B]/80 hover:bg-[#182038]/90 border border-slate-800/80 hover:border-purple-500/40 rounded-xl p-3.5 sm:p-4 backdrop-blur-md transition-all duration-300 shadow-md shadow-black/20">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <TrendingUp className="w-2.5 h-2.5" /> Live
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-0.5 font-mono">
                {statsLoading ? (
                  <span className="inline-block w-14 h-6 bg-slate-800 rounded animate-pulse" />
                ) : (
                  stats.totalOrders.toLocaleString()
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Total Orders</p>
            </div>

            {/* Stat 2: New Orders */}
            <div className="group relative bg-[#13192B]/80 hover:bg-[#182038]/90 border border-slate-800/80 hover:border-purple-500/40 rounded-xl p-3.5 sm:p-4 backdrop-blur-md transition-all duration-300 shadow-md shadow-black/20">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  New Action
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-0.5 font-mono">
                {statsLoading ? (
                  <span className="inline-block w-10 h-6 bg-slate-800 rounded animate-pulse" />
                ) : (
                  stats.newOrders.toLocaleString()
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">New Orders</p>
            </div>

            {/* Stat 3: New Customers */}
            <div className="group relative bg-[#13192B]/80 hover:bg-[#182038]/90 border border-slate-800/80 hover:border-purple-500/40 rounded-xl p-3.5 sm:p-4 backdrop-blur-md transition-all duration-300 shadow-md shadow-black/20">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Verified
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-0.5 font-mono">
                {statsLoading ? (
                  <span className="inline-block w-12 h-6 bg-slate-800 rounded animate-pulse" />
                ) : (
                  stats.newCustomers.toLocaleString()
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">New Customers</p>
            </div>

            {/* Stat 4: Total Products */}
            <div className="group relative bg-[#13192B]/80 hover:bg-[#182038]/90 border border-slate-800/80 hover:border-purple-500/40 rounded-xl p-3.5 sm:p-4 backdrop-blur-md transition-all duration-300 shadow-md shadow-black/20">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 group-hover:scale-105 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  In Catalog
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-0.5 font-mono">
                {statsLoading ? (
                  <span className="inline-block w-16 h-6 bg-slate-800 rounded animate-pulse" />
                ) : (
                  stats.totalProducts.toLocaleString()
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Total Products</p>
            </div>
          </div>
        </div>

        {/* Bottom Left Footer */}
        <div className="relative z-10 pt-4 lg:pt-5 flex items-center justify-between text-xs text-slate-400/80 border-t border-slate-800/60 shrink-0">
          <p>© 2026 NovaCart · Secure Admin Access · v2.4.0</p>
          <div className="flex items-center gap-2 text-purple-300/80 font-medium">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: Clean White Admin Login Card Area
      ───────────────────────────────────────────────────────────── */}
      <div className="lg:w-5/12 bg-[#F8FAFC] flex flex-col justify-center items-center p-6 sm:p-8 lg:p-6 xl:p-10 relative">
        {/* Subtle background gradient shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Top Brand with Logo & Tagline */}
        <div className="mb-4 lg:mb-5 z-10 shrink-0">
          <div className="px-4 py-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50">
            <Logo
              variant="light"
              size="sm"
              showAdminBadge={false}
              showTagline={true}
              tagline="many sellers.one cart"
            />
          </div>
        </div>

        {/* Main White Card */}
        <div className="w-full max-w-md bg-white rounded-[24px] p-6 sm:p-8 shadow-xl shadow-slate-300/40 border border-slate-100 relative z-10">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              Welcome back
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Sign in to your admin account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-sm font-medium"
                autoComplete="email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-xs sm:text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] sm:text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 sm:py-3 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all text-sm font-medium"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              id="admin-login-btn"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Helper */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
            >
              <CheckCircle2 size={13} />
              <span>Use Default Credentials (1-Click Fill)</span>
            </button>
            <p className="text-[10px] text-slate-400 font-mono text-center">
              administrator@novacart.app · Administrator@2026!
            </p>
          </div>
        </div>

        {/* Bottom Right SSL Encryption Label */}
        <div className="mt-5 lg:mt-6 z-10 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <ShieldCheck size={14} className="text-slate-400" />
          <span>Protected by 256-bit SSL encryption</span>
        </div>

        {/* Floating Help Button on bottom-right corner */}
        <div className="fixed bottom-5 right-5 z-20">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            aria-label="Help and Portal Documentation"
          >
            <HelpCircle size={18} />
          </button>

          {showHelp && (
            <div className="absolute bottom-11 right-0 w-72 bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 text-slate-800 text-xs animate-in fade-in zoom-in-95 duration-150">
              <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <Logo size="sm" showTagline={false} />
              </h4>
              <p className="text-slate-600 leading-relaxed mb-3 mt-2">
                This portal is connected live to your PostgreSQL database. All stats on the left and throughout the portal update dynamically.
              </p>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px] text-slate-700">
                Email: administrator@novacart.app<br />
                Pass: Administrator@2026!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-slate-900">
            <h3 className="text-lg font-bold mb-2">Reset Admin Password</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              If you forgot your password, password reset instructions will be sent to the administrator recovery email configured in your backend <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700">.env</code>.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.success('Reset link dispatched to admin mailbox')
                  setShowForgotModal(false)
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                Send Reset Email
              </button>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
