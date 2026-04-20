"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

/**
 * ThemeToggle — simple 3-state cycle button (system → light → dark → system).
 *
 * Renders a placeholder until mounted (next-themes can't read the
 * theme on the server, so we avoid hydration mismatch by only
 * showing icons after mount).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Basculer le thème"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-workon-border bg-transparent ${className ?? ""}`}
      >
        <Sun className="h-4 w-4 opacity-0" />
      </button>
    );
  }

  const current = theme ?? "system";
  const next =
    current === "system" ? "light" : current === "light" ? "dark" : "system";

  const icon =
    current === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : current === "light" ? (
      <Sun className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );

  const label =
    current === "dark"
      ? "Thème sombre — cliquer pour passer en système"
      : current === "light"
        ? "Thème clair — cliquer pour passer en sombre"
        : "Suit le système — cliquer pour passer en clair";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-workon-border bg-white text-workon-ink transition-colors hover:bg-workon-bg/40 dark:bg-workon-bg-cream dark:text-workon-ink ${className ?? ""}`}
    >
      {icon}
    </button>
  );
}
