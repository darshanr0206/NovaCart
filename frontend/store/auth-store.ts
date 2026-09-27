"use client";

import { create } from "zustand";
import { AuthUser } from "@/types";
import { api } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  hydrate: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  setUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("novacart_access_token", user.accessToken);
        if (user.refreshToken) {
          localStorage.setItem("novacart_refresh_token", user.refreshToken);
        }
        localStorage.setItem("novacart_user", JSON.stringify(user));
        api.defaults.headers.common.Authorization = `Bearer ${user.accessToken}`;
      } else {
        localStorage.removeItem("novacart_access_token");
        localStorage.removeItem("novacart_refresh_token");
        localStorage.removeItem("novacart_user");
        delete api.defaults.headers.common.Authorization;
      }
    }
    set({ user, hydrated: true });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("novacart_user");
      const token = localStorage.getItem("novacart_access_token");
      if (!raw || !token) {
        if (get().user !== null || !get().hydrated) {
          set({ user: null, hydrated: true });
        }
        return;
      }

      const parsed: AuthUser = JSON.parse(raw);
      parsed.accessToken = token;
      const refreshToken = localStorage.getItem("novacart_refresh_token");
      if (refreshToken) {
        parsed.refreshToken = refreshToken;
      }
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      const currentUser = get().user;
      if (
        !get().hydrated ||
        !currentUser ||
        currentUser.userId !== parsed.userId ||
        currentUser.accessToken !== token
      ) {
        set({ user: parsed, hydrated: true });
      }
    } catch {
      set({ user: null, hydrated: true });
    }
  },
  logout: () => {
    get().setUser(null);
  },
  hasRole: (role) => !!get().user?.roles.includes(role),
}));

