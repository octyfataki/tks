"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { deconnecterPartoutAgentAction } from "./actions";

/**
 * Coupe toutes les sessions d'un agent, partout, tout de suite
 * (appareil volé, doute sur qui détient l'accès). L'agent se
 * reconnecte avec son mot de passe actuel — sauf compte suspendu
 * ou révoqué, qui reste fermé. Tracé au journal.
 */
export function BoutonDeconnexionPartout({
  id,
  nbSessions,
  desactive,
  motifDesactive,
}: {
  id: string;
  nbSessions: number;
  desactive?: boolean;
  motifDesactive?: string;
}) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function deconnecter() {
    setMessage(null);
    demarrer(async () => {
      const resultat = await deconnecterPartoutAgentAction(id);
      setMessage(
        resultat.ok
          ? "Sessions coupées."
          : (resultat.erreur ?? "Opération impossible."),
      );
    });
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={desactive || enCours || nbSessions === 0}
        title={
          desactive
            ? (motifDesactive ?? "Action indisponible")
            : "Couper toutes les sessions de l'agent"
        }
        onClick={deconnecter}
      >
        {enCours ? "Coupure…" : "Déconnecter partout"}
      </Button>
      {message ? (
        <span role="status" className="text-[11px] text-muted-foreground">
          {message}
        </span>
      ) : null}
    </span>
  );
}
