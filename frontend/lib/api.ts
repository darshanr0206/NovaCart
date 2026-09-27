import axios from "axios";

const getInitialBaseUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8080/api`;
  }
  return process.env.INTERNAL_API_URL || "http://127.0.0.1:8080/api";
};

export const api = axios.create({
  baseURL: getInitialBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT access token and ensure dynamic baseURL matches current host
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host) {
      config.baseURL = `http://${host}:8080/api`;
    }
    const token = localStorage.getItem("novacart_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    config.baseURL = process.env.INTERNAL_API_URL || "http://127.0.0.1:8080/api";
  }
  return config;
});

// On 401, try to refresh the token. On 403 with a valid token, also try refresh.
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/** Clear all auth data from localStorage and redirect only if on protected path */
const clearAuthSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("novacart_access_token");
    localStorage.removeItem("novacart_refresh_token");
    localStorage.removeItem("novacart_user");
    delete api.defaults.headers.common.Authorization;

    // Only redirect if actively on an authenticated/protected page
    const protectedPaths = ["/account", "/profile", "/orders", "/checkout"];
    const isProtected = protectedPaths.some((p) => window.location.pathname.startsWith(p));
    if (isProtected && !window.location.pathname.startsWith("/login")) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    // Try token refresh on 401 or 403 (expired token causes 403 in Spring Security)
    if ((status === 401 || status === 403) && originalRequest && !originalRequest._retry) {
      if (typeof window === "undefined") return Promise.reject(error);

      // Do NOT try refresh on authentication endpoints
      const url = originalRequest.url || "";
      if (
        url.includes("/auth/login") ||
        url.includes("/auth/verify-otp") ||
        url.includes("/auth/send-otp") ||
        url.includes("/auth/register") ||
        url.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      // If the request had no Authorization header, it was an unauthenticated request; do not force logout
      if (!originalRequest.headers?.Authorization) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem("novacart_refresh_token");
      if (!refreshToken) {
        // Only clear session if user was actually logged in
        if (localStorage.getItem("novacart_user")) {
          clearAuthSession();
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Use the dynamic host (same as request interceptor) so IP-based access works correctly
      const refreshBaseUrl =
        typeof window !== "undefined"
          ? `http://${window.location.hostname}:8080/api`
          : process.env.INTERNAL_API_URL || "http://127.0.0.1:8080/api";

      try {
        const { data } = await axios.post(`${refreshBaseUrl}/auth/refresh`, { refreshToken });
        const newAccessToken = data.accessToken;
        localStorage.setItem("novacart_access_token", newAccessToken);
        if (data.refreshToken) {
          localStorage.setItem("novacart_refresh_token", data.refreshToken);
        }
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        // Sync with novacart_user in localStorage so refresh/reopen has the new token
        const rawUser = localStorage.getItem("novacart_user");
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser);
            parsed.accessToken = newAccessToken;
            if (data.refreshToken) parsed.refreshToken = data.refreshToken;
            localStorage.setItem("novacart_user", JSON.stringify(parsed));
          } catch {}
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  // Handle session-expired errors produced by our interceptor
  if (error instanceof Error && (error as any).isSessionExpired) {
    return "Session expired. Please log in again.";
  }
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.fieldErrors) {
      const fields = Object.keys(error.response.data.fieldErrors).join(", ");
      return `Please check the following fields: ${fields}`;
    }
    return error.response?.data?.message || fallback;
  }
  return fallback;
}
