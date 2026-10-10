"use client";

import { useEffect, useState } from "react";
import { WifiIcon, WifiOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Pastille réseau en direct pour l'en-tête de /agent/parametres.
 *
 * Seule info du bandeau d'état qui n'existe nulle part ailleurs en un
 * coup d'œil : la session a déjà son badge (« Poste prêt » /
 * « Session à renouveler ») et la file vit dans la section Synchro.
 */
export function PastilleReseau() {
  const [enLigne, setEnLigne] = useState<boolean>(() =>
    typeof navigator === "undefined" ||
    typeof navigator.onLine !== "boolean"
      ? true
      : navigator.onLine,
  );

  useEffect(() => {
    const connecter = () => setEnLigne(true);
    const couper = () => setEnLigne(false);
    window.addEventListener("online", connecter);
    window.addEventListener("offline", couper);
    return () => {
      window.removeEventListener("online", connecter);
      window.removeEventListener("offline", couper);
    };
  }, []);

  return (
    <Badge variant="outline" aria-live="polite">
      {enLigne ? (
        <WifiIcon aria-hidden />
      ) : (
        <WifiOffIcon aria-hidden />
      )}
      {enLigne ? "En ligne" : "Hors ligne"}
    </Badge>
  );
}
