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

function Ligne({ etiquette, valeur }: { etiquette: string; valeur: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{etiquette}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{valeur}</dd>
    </div>
  );
}

export function SynchronisationSection() {
  const enLigne = useEtatReseau();

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <Ligne
          etiquette="État du réseau"
          valeur={enLigne ? "En ligne" : "Hors ligne — le travail continue"}
        />
        <Ligne
          etiquette="Écritures en attente"
          valeur="Comptage branché avec S8"
        />
        <Ligne
          etiquette="Dernière synchronisation"
          valeur="Pas encore suivie — arrive avec S8"
        />
        <Ligne
          etiquette="Taux embarqué"
          valeur="Affiché avec sa date quand S3 le fournit"
        />
      </dl>
      <p className="text-xs leading-relaxed text-muted-foreground">
        La session survit à la coupure réseau mais expire quand même. La
        révocation d&apos;un compte n&apos;agit qu&apos;à la synchronisation :
        en cas de téléphone perdu ou volé, prévenez le distributeur sans
        attendre.
      </p>
      <div>
        <Button type="button" disabled>
          Synchroniser maintenant
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          La synchronisation manuelle arrive avec S8 : déclenchée par
          l&apos;appareil, sans permission métier, sans doublon.
        </p>
      </div>
    </div>
  );
}
