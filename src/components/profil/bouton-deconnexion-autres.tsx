"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { deconnecterAutresSessionsAction } from "@/app/admin/profil/actions";

/**
 * Coupe les autres sessions du compte connecté, partout sauf ici.
 * La session courante survit : on reste connecté après le geste.
 */
export function BoutonDeconnexionAutres({ nbAutres }: { nbAutres: number }) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function deconnecter() {
    setMessage(null);
    demarrer(async () => {
      const resultat = await deconnecterAutresSessionsAction();
      setMessage(
        resultat.ok
          ? resultat.coupees === 0
            ? "Aucune autre session."
            : `${resultat.coupees} session${resultat.coupees > 1 ? "s" : ""} coupée${resultat.coupees > 1 ? "s" : ""}.`
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
        disabled={enCours || nbAutres === 0}
        title={nbAutres === 0 ? "Aucune autre session à couper" : "Couper les autres sessions"}
        onClick={deconnecter}
      >
        {enCours ? "Coupure…" : "Déconnecter les autres"}
      </Button>
      {message ? (
        <span role="status" className="text-[11px] text-muted-foreground">
          {message}
        </span>
      ) : null}
    </span>
  );
}
