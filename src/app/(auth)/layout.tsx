import type { ReactNode } from "react";

/**
 * Base commune des pages d'authentification.
 *
 * Route group `(auth)` : il organise les routes sans apparaître dans l'URL.
 * Les routes publiques restent /sign-in, /sign-up, /forgot-password,
 * /pending et /invite/[token] — seul l'arborescence du projet affiche
 * la base d'authentification.
 *
 * Le comportement transversal d'authentification (métadonnées, garde de
 * session, redirection si déjà connecté) se place ici, une seule fois
 * pour tout le groupe. Le rendu visuel, lui, reste dans AuthShell,
 * page par page, car chaque écran porte son propre titre.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
