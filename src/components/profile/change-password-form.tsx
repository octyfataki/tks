"use client";

import * as React from "react";
import { useActionState } from "react";
import { KeyRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LONGUEUR_MOT_DE_PASSE_MIN } from "@/lib/auth-password";
import {
  changerMotDePasseAction,
  type ResultatChangementMotDePasse,
} from "@/app/admin/profile/actions";

export function FormulaireMotDePasse() {
  const [resultat, action, enCours] = useActionState(
    changerMotDePasseAction,
    null as ResultatChangementMotDePasse | null,
  );
  const formulaire = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (resultat?.ok) formulaire.current?.reset();
  }, [resultat]);

  return (
    <form action={action} ref={formulaire} className="flex min-w-0 flex-col gap-3">
      <div className="min-w-0">
        <label htmlFor="mot-de-passe-actuel" className="mb-1.5 block text-xs font-medium">
          Mot de passe actuel
        </label>
        <Input
          id="mot-de-passe-actuel"
          name="motDePasseActuel"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="nouveau-mot-de-passe" className="mb-1.5 block text-xs font-medium">
            Nouveau mot de passe
          </label>
          <Input
            id="nouveau-mot-de-passe"
            name="nouveauMotDePasse"
            type="password"
            autoComplete="new-password"
            required
            minLength={LONGUEUR_MOT_DE_PASSE_MIN}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="confirmation-mot-de-passe" className="mb-1.5 block text-xs font-medium">
            Confirmation
          </label>
          <Input
            id="confirmation-mot-de-passe"
            name="confirmationMotDePasse"
            type="password"
            autoComplete="new-password"
            required
            minLength={LONGUEUR_MOT_DE_PASSE_MIN}
          />
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Au moins {LONGUEUR_MOT_DE_PASSE_MIN} caractères. Les autres sessions sont
        déconnectées.
      </p>
      {resultat && !resultat.ok ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {resultat.erreur}
        </p>
      ) : null}
      {resultat?.ok ? (
        <p role="status" className="text-xs font-medium text-green-700">
          Mot de passe changé.
        </p>
      ) : null}
      <div>
        <Button type="submit" size="sm" disabled={enCours}>
          <KeyRoundIcon />
          {enCours ? "Changement…" : "Changer mon mot de passe"}
        </Button>
      </div>
    </form>
  );
}
