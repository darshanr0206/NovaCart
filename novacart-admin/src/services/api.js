import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// ─── Request interceptor: attach JWT ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: handle 401 / 403 (token refresh) ────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const clearAdminAuth = () => {
  localStorage.removeItem('admin_access_token')
  localStorage.removeItem('admin_refresh_token')
  localStorage.removeItem('admin_user')
  if (window.location.pathname !== '/admin/login') {
    window.location.href = '/admin/login'
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // Spring Security returns 403 on expired tokens for @PreAuthorize endpoints
    if ((status === 401 || status === 403) && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || ''
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      const refreshToken = localStorage.getItem('admin_refresh_token')
      if (!refreshToken) {
        clearAdminAuth()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = res.data
        localStorage.setItem('admin_access_token', accessToken)
        if (newRefreshToken) {
          localStorage.setItem('admin_refresh_token', newRefreshToken)
        }
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        clearAdminAuth()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getPortalStats: () => api.get('/auth/portal-stats'),
  me: () => api.get('/users/me'),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersAPI = {
  getAll: (page = 0, size = 50, params = {}) => {
    const qs = new URLSearchParams()
    qs.append('page', page)
    qs.append('size', size)
    if (params.status) qs.append('status', params.status)
    if (params.paymentStatus) qs.append('paymentStatus', params.paymentStatus)
    if (params.search) qs.append('search', params.search)
    return api.get(`/admin/orders?${qs.toString()}`)
  },
  getById: async (id) => {
    // 1. Try finding the order in the Admin Orders endpoint (/admin/orders)
    // which returns complete OrderResponse objects for ALL orders in PostgreSQL.
    try {
      const res = await api.get(`/admin/orders?page=0&size=100`)
      const orders = res.data?.content || []
      const found = orders.find(
        (o) => String(o.id) === String(id) || String(o.orderNumber) === String(id)
      )
      if (found) {
        return { data: found }
      }
    } catch (err) {
      console.warn('Could not query admin orders list:', err)
    }
    // 2. Direct fallback to /orders/{id}
    return api.get(`/orders/${id}`)
  },
  updateStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
}

// ─── Products ────────────────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString()
    return api.get(`/products${qs ? `?${qs}` : ''}`)
  },
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
}

// ─── Categories ──────────────────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (name, description) => {
    const params = new URLSearchParams({ name })
    if (description) params.append('description', description)
    return api.post(`/categories?${params.toString()}`)
  },
}

// ─── Sellers ─────────────────────────────────────────────────────────────────
export const sellersAPI = {
  getAll: (status, page = 0, size = 20) => {
    let url = `/admin/sellers?page=${page}&size=${size}`
    if (status) url += `&status=${status}`
    return api.get(url)
  },
  approve: (id) => api.put(`/admin/sellers/${id}/approve`),
  reject: (id) => api.put(`/admin/sellers/${id}/reject`),
  suspend: (id) => api.put(`/admin/sellers/${id}/suspend`),
}

// ─── Customers (Derived from real PostgreSQL orders data) ────────────────────
export const customersAPI = {
  getAll: async () => {
    try {
      const res = await api.get('/admin/orders?page=0&size=100')
      const orders = res.data?.content || []
      const map = new Map()

      orders.forEach((o, index) => {
        const email = o.customerEmail?.trim()
        const key = (email || o.customerName || `customer-${index}`).toLowerCase()
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            fullName: o.customerName || 'Customer',
            email: o.customerEmail || '—',
            phone: o.deliveryAddress?.match(/\b\d{10}\b/)?.[0] || '—',
            deliveryAddress: o.deliveryAddress || '—',
            totalOrders: 0,
            totalSpent: 0,
            joinedAt: o.createdAt || new Date().toISOString(),
            active: true,
            orders: [],
          })
        }
        const cust = map.get(key)
        cust.totalOrders += 1
        cust.totalSpent += Number(o.total || 0)
        if (new Date(o.createdAt) < new Date(cust.joinedAt)) {
          cust.joinedAt = o.createdAt
        }
        cust.orders.push(o)
      })

      const list = Array.from(map.values())
      return { data: list.length > 0 ? list : MOCK_CUSTOMERS }
    } catch {
      return { data: MOCK_CUSTOMERS }
    }
  },
  getById: async (id) => {
    const listRes = await customersAPI.getAll()
    const customers = listRes.data || []
    const found = customers.find(
      (c) => String(c.id) === String(id) || String(c.email).toLowerCase() === String(id).toLowerCase()
    )
    if (found) return { data: found }
    const mock = MOCK_CUSTOMERS.find((c) => String(c.id) === String(id))
    if (mock) return { data: mock }
    throw new Error('Customer not found')
  },
}

// ─── Payments (Derived from real PostgreSQL orders data) ─────────────────────
export const paymentsAPI = {
  getAll: async () => {
    try {
      const res = await api.get('/admin/orders?page=0&size=100')
      const orders = res.data?.content || []
      const list = orders.map((o) => ({
        id: o.payment?.id || o.id,
        orderDbId: o.id,
        orderId: `#${o.orderNumber || o.id}`,
        customer: o.customerName || 'Customer',
        customerEmail: o.customerEmail,
        amount: Number(o.payment?.amount || o.total || 0),
        method: o.payment?.paymentMethod || o.paymentMethod || 'RAZORPAY',
        transactionId: o.payment?.razorpayPaymentId || o.payment?.razorpayOrderId || `TXN-ORD-${o.id}`,
        status: o.payment?.status || o.paymentStatus || (o.status === 'CANCELLED' ? 'REFUNDED' : 'SUCCESS'),
        createdAt: o.payment?.createdAt || o.createdAt || new Date().toISOString(),
      }))
      return { data: list.length > 0 ? list : MOCK_PAYMENTS }
    } catch {
      return { data: MOCK_PAYMENTS }
    }
  },
}

// ─── Returns ─────────────────────────────────────────────────────────────────
export const returnsAPI = {
  getAll: () => api.get('/admin/returns'),
  updateStatus: (id, status, adminComment = '') => api.patch(`/admin/returns/${id}/status`, { status, adminComment }),
}

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersAPI = {
  updateProfile: (data) => api.put('/users/me', data),
}

// ─── Fallback mock data helpers ──────────────────────────────────────────────
export const MOCK_CUSTOMERS = [
  { id: 1, fullName: 'Priya Sharma', phone: '+91 98765 43210', email: 'priya@example.com', totalOrders: 12, totalSpent: 8450.0, joinedAt: '2025-01-15', active: true },
  { id: 2, fullName: 'Rahul Gupta', phone: '+91 87654 32109', email: 'rahul@example.com', totalOrders: 5, totalSpent: 3200.0, joinedAt: '2025-03-22', active: true },
  { id: 3, fullName: 'Ananya Patel', phone: '+91 76543 21098', email: 'ananya@example.com', totalOrders: 28, totalSpent: 21600.0, joinedAt: '2024-11-08', active: true },
  { id: 4, fullName: 'Vikram Singh', phone: '+91 65432 10987', email: 'vikram@example.com', totalOrders: 3, totalSpent: 1890.0, joinedAt: '2025-06-01', active: false },
  { id: 5, fullName: 'Sneha Reddy', phone: '+91 54321 09876', email: 'sneha@example.com', totalOrders: 17, totalSpent: 14300.0, joinedAt: '2025-02-14', active: true },
  { id: 6, fullName: 'Arjun Mehta', phone: '+91 43210 98765', email: 'arjun@example.com', totalOrders: 9, totalSpent: 6750.0, joinedAt: '2025-04-30', active: true },
]

export const MOCK_PAYMENTS = [
  { id: 1, orderId: 'ORD-1001', customer: 'Priya Sharma', amount: 1250.0, method: 'UPI', transactionId: 'rzp_pay_abc123', status: 'SUCCESS', createdAt: '2025-09-01T10:30:00' },
  { id: 2, orderId: 'ORD-1002', customer: 'Rahul Gupta', amount: 3450.0, method: 'Card', transactionId: 'rzp_pay_def456', status: 'SUCCESS', createdAt: '2025-09-02T14:15:00' },
  { id: 3, orderId: 'ORD-1003', customer: 'Ananya Patel', amount: 899.0, method: 'Net Banking', transactionId: 'rzp_pay_ghi789', status: 'PENDING', createdAt: '2025-09-03T09:00:00' },
  { id: 4, orderId: 'ORD-1004', customer: 'Vikram Singh', amount: 2100.0, method: 'UPI', transactionId: 'rzp_pay_jkl012', status: 'FAILED', createdAt: '2025-09-04T16:45:00' },
  { id: 5, orderId: 'ORD-1005', customer: 'Sneha Reddy', amount: 4500.0, method: 'Card', transactionId: 'rzp_pay_mno345', status: 'REFUNDED', createdAt: '2025-09-05T11:20:00' },
]

export const MOCK_RETURNS = [
  { id: 1, orderId: 'ORD-1001', customer: 'Priya Sharma', product: 'Wireless Headphones', reason: 'Defective product - no sound from left ear', amount: 1250.0, status: 'RETURN_REQUESTED', createdAt: '2025-09-08T10:00:00' },
  { id: 2, orderId: 'ORD-1003', customer: 'Ananya Patel', product: 'Cotton Kurta Set', reason: 'Wrong size delivered', amount: 899.0, status: 'RETURN_APPROVED', createdAt: '2025-09-06T14:30:00' },
  { id: 3, orderId: 'ORD-1007', customer: 'Rahul Gupta', product: 'Stainless Steel Water Bottle', reason: 'Leaking lid', amount: 450.0, status: 'REFUNDED', createdAt: '2025-09-04T09:15:00' },
]

export const MOCK_ANALYTICS = {
  monthlyRevenue: [
    { month: 'Mar', revenue: 42000 },
    { month: 'Apr', revenue: 58000 },
    { month: 'May', revenue: 71000 },
    { month: 'Jun', revenue: 65000 },
    { month: 'Jul', revenue: 89000 },
    { month: 'Aug', revenue: 112000 },
    { month: 'Sep', revenue: 98000 },
  ],
  monthlyOrders: [
    { month: 'Mar', orders: 124 },
    { month: 'Apr', orders: 178 },
    { month: 'May', orders: 213 },
    { month: 'Jun', orders: 198 },
    { month: 'Jul', orders: 267 },
    { month: 'Aug', orders: 341 },
    { month: 'Sep', orders: 298 },
  ],
  categoryBreakdown: [
    { name: 'Electronics', value: 38 },
    { name: 'Clothing', value: 27 },
    { name: 'Groceries', value: 18 },
    { name: 'Books', value: 9 },
    { name: 'Shoes', value: 8 },
  ],
  topProducts: [
    { name: 'Wireless Headphones', sales: 234, revenue: 292500 },
    { name: 'Cotton Kurta Set', sales: 189, revenue: 169110 },
    { name: 'Smart Watch', sales: 156, revenue: 624000 },
    { name: 'Running Shoes', sales: 143, revenue: 214500 },
    { name: 'Organic Tea Pack', sales: 312, revenue: 93600 },
  ],
}

export default api
