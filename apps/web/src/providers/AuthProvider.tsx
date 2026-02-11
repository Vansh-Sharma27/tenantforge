"use client";

import { useEffect } from "react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthenticated, setLoading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem("tf_access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Verify token by fetching current user
    // For now, decode JWT payload client-side
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        // Token expired, try refresh
        const refreshToken = localStorage.getItem("tf_refresh_token");
        if (refreshToken) {
          api
            .post("/auth/refresh", { refreshToken })
            .then(({ data }) => {
              localStorage.setItem("tf_access_token", data.data.accessToken);
              localStorage.setItem("tf_refresh_token", data.data.refreshToken);
              setAuthenticated(true);
              setUser({
                id: payload.sub,
                email: payload.email,
                name: null,
                avatarUrl: null,
                status: "ACTIVE",
                emailVerified: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            })
            .catch(() => {
              localStorage.removeItem("tf_access_token");
              localStorage.removeItem("tf_refresh_token");
            })
            .finally(() => setLoading(false));
          return;
        }
        localStorage.removeItem("tf_access_token");
        setLoading(false);
        return;
      }

      setAuthenticated(true);
      setUser({
        id: payload.sub,
        email: payload.email,
        name: null,
        avatarUrl: null,
        status: "ACTIVE",
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setLoading(false);
    } catch {
      localStorage.removeItem("tf_access_token");
      setLoading(false);
    }
  }, [setUser, setAuthenticated, setLoading]);

  return <>{children}</>;
}
