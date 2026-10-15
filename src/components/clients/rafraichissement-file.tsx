"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RafraichissementFile({
  etiquette = "Actualiser la file",
  suivi = "File",
  intervalleMs = 10000,
}: {
  etiquette?: string;
  suivi?: string;
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
