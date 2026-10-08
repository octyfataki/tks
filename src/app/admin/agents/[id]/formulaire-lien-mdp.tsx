"use client";

import * as React from "react";
import { useActionState } from "react";
import { KeyRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoutonCopierLien } from "../../invitations/bouton-copier";
import {
  genererLienMotDePasseAgentAction,
  type ResultatLienMotDePasse,
} from "./actions";

/**
 * Génère un lien de réinitialisation de mot de passe pour un agent
 * (mot de passe oublié) : jeton unique, 24 h, choix du mot de passe
 * uniquement. Le lien s'affiche une seule fois, prêt à copier — à
 * transmettre à l'agent par un canal sûr, jamais par copier-coller
 * public. La garde réelle est côté serveur.
 */
export function FormulaireLienMotDePasse({ id }: { id: string }) {
  const [resultat, action, enCours] = useActionState(
    genererLienMotDePasseAgentAction.bind(null, id),
    null as ResultatLienMotDePasse | null,
  );

  return (
    <div className="mt-3 flex flex-col gap-2">
      <form action={action}>
        <Button type="submit" size="sm" variant="outline" disabled={enCours}>
          <KeyRoundIcon />
          {enCours ? "Génération…" : "Générer un lien de réinitialisation"}
        </Button>
      </form>
      {resultat && !resultat.ok ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {resultat.erreur}
        </p>
      ) : null}
      {resultat?.ok ? (
        <span role="status" className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5">
            <code className="max-w-52 truncate font-mono text-[11px] select-all">
              {resultat.lien}
            </code>
            <BoutonCopierLien lien={resultat.lien} />
          </span>
          <span className="text-[11px] text-muted-foreground">
            Usage unique, 24 h. Transmettez-le à l&apos;agent, il choisit
            lui-même son nouveau mot de passe.
          </span>
        </span>
      ) : null}
    </div>
  );
}
