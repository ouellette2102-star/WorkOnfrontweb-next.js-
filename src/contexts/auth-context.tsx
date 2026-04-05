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
  isAuthenticated as checkAuth,
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

  // Check auth on mount
  useEffect(() => {
    async function init() {
      if (!checkAuth()) {
        setIsLoading(false);
        return;
      }
      // Try cached user first for instant UI
      const cached = getCachedUser();
      if (cached) setUser(cached);

      // Then verify with backend
      const fresh = await fetchCurrentUser();
      if (fresh) {
        setUser(fresh);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
    init();
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
