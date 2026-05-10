"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { safeLocalStorage } from "@/lib/safe-storage";

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
  const { user } = useAuth();
  const [mode, setModeState] = useState<Mode>(() => {
    const stored = safeLocalStorage.getItem(STORAGE_KEY) as Mode | null;
    if (stored === "pro" || stored === "client") return stored;
    return defaultModeFromRole(user?.role);
  });

  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode);
    safeLocalStorage.setItem(STORAGE_KEY, newMode);
  }, []);

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
