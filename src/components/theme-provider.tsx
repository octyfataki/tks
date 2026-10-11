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
  // Le premier rendu DOIT être identique à celui du serveur, donc il part
  // toujours de `defaultTheme` ; la valeur stockée est lue après montage.
  // Lire le stockage ici (initialiseur paresseux) rendait le premier rendu
  // client différent du HTML serveur dès que la valeur stockée s'écartait du
  // défaut : React signalait alors un désaccord d'hydratation sur le sélecteur
  // de thème (aria-checked, classes), et React ne le corrige pas.
  // Même démarche que `usePreferencesClient`.
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  // Résolution volontairement constante au premier rendu : interroger
  // `prefers-color-scheme` ici diverge aussi du serveur, qui ne voit que
  // « clair ». L'effet ci-dessous corrige la valeur après le montage.
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(
    defaultTheme === "dark" ? "dark" : "light"
  )

  const stockeLu = React.useRef(false)

  React.useEffect(() => {
    // Première passe : on reprend la valeur stockée. Tant qu'elle n'est pas
    // connue, on ne touche pas au DOM — le script inline de <head> a déjà
    // posé la bonne classe avant le premier paint, la réappliquer ici
    // provoquerait un clignotement clair/sombre au chargement.
    if (!stockeLu.current) {
      stockeLu.current = true
      let stocke: Theme = defaultTheme
      try {
        const brut = window.localStorage.getItem(storageKey)
        if (brut === "light" || brut === "dark" || brut === "system") {
          stocke = brut
        }
      } catch {
        // Stockage indisponible (navigation privée) : on garde le défaut.
      }
      if (stocke !== theme) {
        // L'effet va repartir avec le bon thème et appliquer le DOM.
        setThemeState(stocke)
        return
      }
    }

    const appliquer = () => {
      const resolved = resolveTheme(theme)
      setResolvedTheme(resolved)
      document.documentElement.classList.toggle("dark", resolved === "dark")
      document.documentElement.style.colorScheme = resolved
    }
    appliquer()

    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => appliquer()
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme, defaultTheme, storageKey])

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
