"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * L'autre sens de la communication : quand le client dépose une pièce
 * depuis /pending, la file /admin/clients/validation doit le voir sans
 * rechargement manuel. Scrutation douce (router.refresh toutes les
 * 10 s + retour d'onglet + reconnexion), jamais de boucle quand l'onglet
 * est caché. Hors-ligne : le refresh échoue en silence, la file gardée
 * reste lisible.
 */
export function RafraichissementFile() {
  const routeur = useRouter();
  const [actualiseLe, setActualiseLe] = React.useState<Date | null>(() => new Date());
  const [enCours, setEnCours] = React.useState(false);

  const rafraichir = React.useCallback(() => {
    setEnCours(true);
    try {
      routeur.refresh();
      setActualiseLe(new Date());
    } finally {
      // Le refresh serveur n'a pas de promesse : on retombe vite.
      window.setTimeout(() => setEnCours(false), 600);
    }
  }, [routeur]);

  React.useEffect(() => {
    const minuteur = window.setInterval(() => {
      if (document.visibilityState === "visible") rafraichir();
    }, 10000);
    const surVisible = () => {
      if (document.visibilityState === "visible") rafraichir();
    };
    window.addEventListener("focus", rafraichir);
    window.addEventListener("online", rafraichir);
    document.addEventListener("visibilitychange", surVisible);
    return () => {
      window.clearInterval(minuteur);
      window.removeEventListener("focus", rafraichir);
      window.removeEventListener("online", rafraichir);
      document.removeEventListener("visibilitychange", surVisible);
    };
  }, [rafraichir]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={rafraichir}
        disabled={enCours}
      >
        <RefreshCwIcon className={enCours ? "animate-spin" : undefined} />
        {enCours ? "Actualisation…" : "Actualiser la file"}
      </Button>
      <span aria-live="polite">
        {actualiseLe
          ? `File suivie en direct — actualisée à ${actualiseLe.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
          : "File suivie en direct."}
      </span>
    </div>
  );
}
