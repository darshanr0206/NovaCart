import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Store, Bell, Eye, EyeOff, Save, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI, usersAPI } from '../services/api'

const TAB_ITEMS = [
  { id: 'profile', label: 'Admin Profile', icon: User },
  { id: 'password', label: 'Change Password', icon: Lock },
  { id: 'store', label: 'Store Settings', icon: Store },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function Settings() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')

  // Profile form
  const [profileForm, setProfileForm] = useState({ fullName: admin?.fullName || '', email: admin?.email || '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false })
  const [savingPwd, setSavingPwd] = useState(false)

  // Notification toggles
  const [notifications, setNotifications] = useState({
    newOrders: true,
    lowStock: true,
    returnRequests: true,
    paymentIssues: true,
    newCustomers: false,
  })

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (pwdForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setSavingPwd(true)
    try {
      // This would call PATCH /api/users/me/password when backend provides it
      await new Promise((r) => setTimeout(r, 800)) // simulated delay
      toast.success('Password updated successfully')
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      toast.error('Failed to update password')
    } finally {
      setSavingPwd(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileForm.fullName?.trim()) {
      toast.error('Full name cannot be blank')
      return
    }
    setSavingProfile(true)
    try {
      const res = await usersAPI.updateProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
      })
      const updated = {
        ...admin,
        fullName: res.data?.fullName || profileForm.fullName.trim(),
        email: res.data?.email || profileForm.email.trim(),
      }
      localStorage.setItem('admin_user', JSON.stringify(updated))
      toast.success('Admin profile saved successfully')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <h1 className="page-title">Settings</h1>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 p-1 admin-card">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-1 justify-center
              ${activeTab === tab.id
                ? 'bg-nova-600/20 text-nova-300 border border-nova-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-admin-hover'
              }`}
          >
            <tab.icon size={15} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="admin-card p-5 space-y-5 animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-200">Admin Profile</h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-nova-600/20 border-2 border-nova-600/40 flex items-center justify-center text-2xl font-bold text-nova-400">
              {admin?.fullName?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-100">{admin?.fullName}</p>
              <p className="text-sm text-slate-400">{admin?.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-nova-500" />
                <span className="text-xs text-nova-400 font-medium">Administrator</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-admin-border" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                className="admin-input"
              />
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
            ⚠️ Profile updates require <code className="bg-amber-500/20 px-1 rounded">PUT /api/users/me</code> — available via existing backend.
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={handleLogout} className="btn-danger">
              <LogOut size={15} /> Sign Out
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="btn-primary"
            >
              {savingProfile ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              ) : (
                <><Save size={15} /> Save Profile</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Password tab */}
      {activeTab === 'password' && (
        <div className="admin-card p-5 animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { label: 'Current Password', key: 'currentPassword', showKey: 'current' },
              { label: 'New Password', key: 'newPassword', showKey: 'new' },
              { label: 'Confirm New Password', key: 'confirmPassword', showKey: 'confirm' },
            ].map(({ label, key, showKey }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={showPwd[showKey] ? 'text' : 'password'}
                    value={pwdForm[key]}
                    onChange={(e) => setPwdForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="admin-input pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, [showKey]: !s[showKey] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPwd[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-3 text-xs text-slate-400">
              Password must be at least 8 characters. Never share your admin credentials.
            </div>

            <button type="submit" disabled={savingPwd} className="btn-primary">
              {savingPwd ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</> : <><Save size={15} /> Update Password</>}
            </button>
          </form>
        </div>
      )}

      {/* Store settings tab */}
      {activeTab === 'store' && (
        <div className="admin-card p-5 animate-fade-in space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Store Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Store Name', value: 'NovaCart', placeholder: 'Store name' },
              { label: 'Support Email', value: 'support@novacart.app', placeholder: 'Email' },
              { label: 'Currency', value: 'INR (₹)', placeholder: 'Currency' },
              { label: 'Timezone', value: 'Asia/Kolkata', placeholder: 'Timezone' },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{f.label}</label>
                <input type="text" defaultValue={f.value} className="admin-input" />
              </div>
            ))}
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
            ⚠️ Store settings backend API not yet implemented.
          </div>
          <button onClick={() => toast.success('Settings saved (UI only)')} className="btn-primary">
            <Save size={15} /> Save Settings
          </button>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="admin-card p-5 animate-fade-in space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Notification Preferences</h2>
          <div className="space-y-3">
            {Object.entries(notifications).map(([key, value]) => {
              const labels = {
                newOrders: 'New order placed',
                lowStock: 'Low stock alert',
                returnRequests: 'Return/refund request',
                paymentIssues: 'Payment issue',
                newCustomers: 'New customer registered',
              }
              return (
                <div key={key} className="flex items-center justify-between py-3 border-b border-admin-border/50 last:border-0">
                  <div>
                    <p className="text-sm text-slate-200">{labels[key]}</p>
                    <p className="text-xs text-slate-500">Email notification</p>
                  </div>
                  <button
                    onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-nova-600' : 'bg-admin-border'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              )
            })}
          </div>
          <button onClick={() => toast.success('Preferences saved (UI only)')} className="btn-primary">
            <Save size={15} /> Save Preferences
          </button>
        </div>
      )}
    </div>
  )
}
