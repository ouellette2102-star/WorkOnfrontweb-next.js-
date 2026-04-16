"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";

type Mode = "pro" | "client";

interface ModeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

const STORAGE_KEY = "workon_mode";

function defaultModeFromRole(role?: string): Mode {
  if (role === "worker") return "pro";
  return "client";
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as Mode | null;
      if (stored === "pro" || stored === "client") return stored;
    }
    return defaultModeFromRole(user?.role);
  });

  // Sync default from user role on first load (when no localStorage value)
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const def = defaultModeFromRole(user.role);
      setModeState(def);
    }
  }, [user]);

  const setMode = useCallback(
    async (newMode: Mode) => {
      setModeState(newMode);
      localStorage.setItem(STORAGE_KEY, newMode);

      // Sync role to backend
      const backendRole = newMode === "pro" ? "worker" : "employer";
      try {
        await api.updateProfile({ role: backendRole } as Parameters<typeof api.updateProfile>[0]);
        await refreshUser();
      } catch {
        // Silent fail — the UI already switched, backend sync is best-effort
      }
    },
    [refreshUser],
  );

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
