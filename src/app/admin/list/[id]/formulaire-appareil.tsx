"use client";

import * as React from "react";
import { useActionState } from "react";
import { PencilIcon, SmartphoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  modifierAppareil2faAction,
  type ResultatModificationAppareil,
} from "./actions";

/**
 * Renomme l'étiquette d'appareil du second facteur. Seul le libellé est
 * écrit — le secret TOTP ne transite jamais par ce formulaire (S2-04).
 * La garde réelle est côté serveur.
 */
export function FormulaireAppareil({
  id,
  nomAppareilInitial,
}: {
  id: string;
  nomAppareilInitial: string;
}) {
  const [resultat, action, enCours] = useActionState(
    modifierAppareil2faAction.bind(null, id),
    null as ResultatModificationAppareil | null,
  );
  const [nomAppareil, setNomAppareil] = React.useState(nomAppareilInitial);
  const sale = nomAppareil.trim() !== nomAppareilInitial;

  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <div>
        <label htmlFor="nomAppareil" className="mb-1.5 block text-xs font-medium">
          Nom de l&apos;appareil
        </label>
        <div className="group relative">
          <SmartphoneIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            id="nomAppareil"
            name="nomAppareil"
            type="text"
            autoComplete="off"
            required
            minLength={2}
            maxLength={255}
            value={nomAppareil}
            onChange={(event) => setNomAppareil(event.target.value)}
            className="rounded-lg pl-9"
          />
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Étiquette uniquement — le secret du second facteur n&apos;est jamais
        affiché ni touché.
      </p>
      {resultat && !resultat.ok ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {resultat.erreur}
        </p>
      ) : null}
      {resultat?.ok ? (
        <p role="status" className="text-xs font-medium text-green-700">
          {resultat.inchange ? "Aucun changement." : "Appareil renommé."}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="sm" disabled={enCours || !sale}>
          <PencilIcon />
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
