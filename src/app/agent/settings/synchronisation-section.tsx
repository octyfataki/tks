"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * État de synchronisation vu par l'agent de service (S8).
 *
 * Honnêteté d'étape : la file durable, le compteur d'écritures en attente,
 * la date de dernière synchronisation et la file des photos arrivent avec
 * S8 — aucun chiffre n'est inventé ici. Seul l'état réseau est réel
 * (`navigator.onLine`), et la synchronisation manuelle reste désactivée
 * tant que le point de convergence n'existe pas.
 */
function useEtatReseau(): boolean {
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
  return enLigne;
}

function LigneStatut({
  etiquette,
  valeur,
  ton = "neutre",
}: {
  etiquette: string;
  valeur: string;
  ton?: "ok" | "alerte" | "neutre";
}) {
  const pastille =
    ton === "ok"
      ? "bg-emerald-500"
      : ton === "alerte"
        ? "bg-destructive"
        : "bg-muted-foreground/40";
  return (
    <li className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${pastille}`} />
        <span className="truncate text-[13px] text-muted-foreground">{etiquette}</span>
      </span>
      <span className="shrink-0 text-right text-[13px] font-semibold text-foreground tabular-nums">
        {valeur}
      </span>
    </li>
  );
}

export function SynchronisationSection() {
  const enLigne = useEtatReseau();

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-dashed">
        <LigneStatut
          etiquette="État du réseau"
          valeur={enLigne ? "En ligne" : "Hors ligne — on continue"}
          ton={enLigne ? "ok" : "alerte"}
        />
        <LigneStatut
          etiquette="Écritures en attente"
          valeur="Comptage S8"
        />
        <LigneStatut
          etiquette="Dernière synchro"
          valeur="Pas encore suivie"
        />
        <LigneStatut
          etiquette="Taux embarqué"
          valeur="Avec S3, daté"
        />
      </ul>
      <p className="rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        La session survit à la coupure réseau mais expire quand même. La
        révocation d’un compte n’agit qu’à la synchronisation : en cas de
        téléphone perdu ou volé, prévenez le distributeur sans attendre.
      </p>
      <div className="flex flex-col gap-2">
        <Button type="button" disabled className="self-start">
          Synchroniser maintenant
        </Button>
        <p className="text-xs text-muted-foreground">
          La synchro manuelle arrive avec S8 : déclenchée par l’appareil, sans
          doublon.
        </p>
      </div>
    </div>
  );
}
