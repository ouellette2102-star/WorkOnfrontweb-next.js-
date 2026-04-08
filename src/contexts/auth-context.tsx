"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  type AuthUser,
  type LoginDto,
  type RegisterDto,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  fetchCurrentUser,
  getCachedUser,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<AuthUser>;
  register: (dto: RegisterDto) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount.
  //
  // We always call fetchCurrentUser() (which hits the same-origin
  // /api/auth/me proxy that uses the httpOnly cookie). We do NOT gate
  // on localStorage because it can be empty even when the user is
  // authenticated server-side (e.g. fresh tab, browser cleared local
  // storage but kept cookies, or hard navigation after a server-set
  // cookie). The cached user is only used for instant UI hydration.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const cached = getCachedUser();
      if (cached) setUser(cached);

      const fresh = await fetchCurrentUser();
      if (cancelled) return;
      setUser(fresh);
      setIsLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const res = await authLogin(dto);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (dto: RegisterDto) => {
    const res = await authRegister(dto);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await fetchCurrentUser();
    if (fresh) setUser(fresh);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
