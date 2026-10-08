"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { BoutonCopierLien } from "./bouton-copier";
import {
  rouvrirPremierAccesAction,
  type ResultatRenvoiAcces,
} from "./actions";

const ETAT_INITIAL: ResultatRenvoiAcces | null = null;

/**
 * Renvoie un lien de premier accès quand le précédent a expiré (ou a déjà
 * servi). Le nouveau lien apparaît sous le bouton, prêt à copier : usage
 * unique, 24 h, choix du mot de passe uniquement.
 */
export function FormulaireRenvoiAcces({
  cibleId,
  nom,
}: {
  cibleId: string;
  nom: string;
}) {
  const [resultat, action, enCours] = useActionState(
    rouvrirPremierAccesAction,
    ETAT_INITIAL,
  );

  return (
    <div className="flex flex-col gap-1.5">
      <form action={action}>
        <input type="hidden" name="cibleId" value={cibleId} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={enCours}
          aria-label={`Renvoyer un lien de premier accès à ${nom}`}
        >
          {enCours ? "Envoi…" : "Renvoyer un lien"}
        </Button>
      </form>
      {resultat && !resultat.ok ? (
        <p role="alert" className="text-[11px] font-medium text-destructive">
          {resultat.erreur}
        </p>
      ) : null}
      {resultat?.ok ? (
        <span role="status" className="flex items-center gap-1.5">
          <code className="max-w-44 truncate font-mono text-[11px] select-all">
            {resultat.lien}
          </code>
          <BoutonCopierLien lien={resultat.lien} />
        </span>
      ) : null}
    </div>
  );
}
