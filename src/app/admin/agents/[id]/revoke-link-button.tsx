"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { revoquerLienMotDePasseAgentAction } from "./actions";

/**
 * Révoque un lien de réinitialisation encore en attente (fuite,
 * erreur de destinataire). Le lien devient définitivement inutilisable.
 */
export function BoutonRevoquerLien({ accesId }: { accesId: string }) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function revoquer() {
    setMessage(null);
    demarrer(async () => {
      const resultat = await revoquerLienMotDePasseAgentAction(accesId);
      setMessage(
        resultat.ok ? "Lien révoqué." : (resultat.erreur ?? "Opération impossible."),
      );
    });
  }

  return (
    <span className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={enCours}
        onClick={revoquer}
      >
        {enCours ? "Révocation…" : "Révoquer ce lien"}
      </Button>
      {message ? (
        <span role="status" className="text-[11px] text-muted-foreground">
          {message}
        </span>
      ) : null}
    </span>
  );
}
