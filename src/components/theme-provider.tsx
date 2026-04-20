"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

/**
 * ThemeProvider — mounts next-themes with WorkOn defaults.
 *
 * attribute="class"   : toggles `.dark` on <html>, matching the
 *                       globals.css `.dark` variable overrides.
 * defaultTheme="system" : respects the user's OS preference on first
 *                         visit (can still toggle manually).
 * enableSystem         : reacts to prefers-color-scheme media query.
 * disableTransitionOnChange : avoids the flash-of-styled-content when
 *                             the theme flips mid-session.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
