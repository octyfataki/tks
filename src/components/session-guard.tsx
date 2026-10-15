"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";

// Une session peut mourir sans déconnexion explicite : expiration (7 jours),
// révocation ou suspension par un administrateur, déconnexion dans un autre
// onglet, cookies effacés. Le layout serveur ne revérifie qu'à la navigation :
// entre deux navigations, la page resterait affichée avec une session morte
// et chaque action échouerait au lieu de renvoyer vers la connexion.
// Ce gardien revérifie la session au retour d'onglet, à la reconnexion et
// toutes les minutes : session absente → /sign-in. Hors-ligne (requête
// rejetée) : on ne conclut rien, la page reste lisible (offline-first).
const DELAI_VERIFICATION_MS = 60_000;

export function GardienSession() {
  const routeur = useRouter();
  const dejaParti = React.useRef(false);

  const verifier = React.useCallback(async () => {
    if (dejaParti.current) return;
    let session: unknown;
    try {
      ({ data: session } = await getSession());
    } catch {
      // Hors-ligne : pas de verdict, pas de redirection.
      return;
    }
    if (!session) {
      dejaParti.current = true;
      routeur.push("/sign-in");
      routeur.refresh();
    }
  }, [routeur]);

  React.useEffect(() => {
    void verifier();
    const minuteur = window.setInterval(() => {
      if (document.visibilityState === "visible") void verifier();
    }, DELAI_VERIFICATION_MS);
    const surRetour = () => {
      if (document.visibilityState !== "hidden") void verifier();
    };
    window.addEventListener("focus", surRetour);
    window.addEventListener("online", surRetour);
    document.addEventListener("visibilitychange", surRetour);
    return () => {
      window.clearInterval(minuteur);
      window.removeEventListener("focus", surRetour);
      window.removeEventListener("online", surRetour);
      document.removeEventListener("visibilitychange", surRetour);
    };
  }, [verifier]);

  return null;
}
