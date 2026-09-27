import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('admin_access_token')
    const savedAdmin = localStorage.getItem('admin_user')
    if (token && savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin)
        // Verify the saved user has ADMIN role
        const hasAdminRole = parsed.roles && (parsed.roles.includes('ROLE_ADMIN') || parsed.roles.includes('ADMIN'))
        if (hasAdminRole) {
          setAdmin(parsed)
        } else {
          clearSession()
        }
      } catch {
        clearSession()
      }
    }
    setLoading(false)
  }, [])

  const clearSession = () => {
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    setAdmin(null)
  }

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password)
    const data = res.data

    // Verify the user is an ADMIN
    const hasAdminRole = data.roles && (data.roles.includes('ROLE_ADMIN') || data.roles.includes('ADMIN'))
    if (!hasAdminRole) {
      throw new Error('Access denied. Admin privileges required.')
    }

    localStorage.setItem('admin_access_token', data.accessToken)
    localStorage.setItem('admin_refresh_token', data.refreshToken)

    const userData = {
      id: data.userId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      roles: data.roles,
    }
    localStorage.setItem('admin_user', JSON.stringify(userData))
    setAdmin(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [])

  const value = {
    admin,
    loading,
    login,
    logout,
    isAuthenticated: !!admin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
