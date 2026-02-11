import type { User } from "@tenantforge/shared";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setLoading: (value) => set({ isLoading: value }),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem("tf_access_token", accessToken);
    localStorage.setItem("tf_refresh_token", refreshToken);
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("tf_access_token");
    localStorage.removeItem("tf_refresh_token");
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
