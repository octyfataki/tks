"use client"

import * as React from "react"
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "./theme-script"

export type Theme = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light"
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme
}

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme
    try {
      const stored = window.localStorage.getItem(storageKey) as Theme | null
      return stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : defaultTheme
    } catch {
      return defaultTheme
    }
  })
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(
    () => resolveTheme(theme)
  )

  React.useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme)
      setResolvedTheme(resolved)
      document.documentElement.classList.toggle("dark", resolved === "dark")
      document.documentElement.style.colorScheme = resolved
    }
    apply()

    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => apply()
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = React.useCallback(
    (next: Theme) => {
      setThemeState(next)
      try {
        window.localStorage.setItem(storageKey, next)
      } catch {
        // stockage indisponible (navigation privée) : on ignore
      }
    },
    [storageKey]
  )

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme doit être utilisé dans <ThemeProvider>")
  return ctx
}
