"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * L'autre sens de la communication : quand le client dépose une pièce
 * depuis /pending, la file de validation doit le voir sans rechargement
 * manuel. Scrutation douce (router.refresh + retour d'onglet +
 * reconnexion), jamais de boucle quand l'onglet est caché. Hors-ligne :
 * le refresh échoue en silence, les données gardées restent lisibles.
 *
 * Par défaut la file chaude (10 s) ; les listes utilisent le libellé
 * « liste » avec 30 s.
 */
export function RafraichissementFile({
  etiquette = "Actualiser la file",
  suivi = "File",
  intervalleMs = 10000,
}: {
  /** Libellé du bouton. */
  etiquette?: string;
  /** Préfixe du message de suivi. */
  suivi?: string;
  /** Scrutation douce en ms. */
  intervalleMs?: number;
} = {}) {
  const routeur = useRouter();
  const [actualiseLe, setActualiseLe] = React.useState<Date | null>(
    () => new Date(),
  );
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
    }, intervalleMs);
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
  }, [rafraichir, intervalleMs]);

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
        {enCours ? "Actualisation…" : etiquette}
      </Button>
      <span aria-live="polite">
        {actualiseLe
          ? `${suivi} suivie en direct — actualisée à ${actualiseLe.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
          : `${suivi} suivie en direct.`}
      </span>
    </div>
  );
}
