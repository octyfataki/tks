"use client";

import * as React from "react";
import { useActionState } from "react";
import { PencilIcon, PhoneIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  modifierMonProfilAction,
  type ResultatModificationMonProfil,
} from "./actions";

/**
 * Corrige le nom affiché + le téléphone contact du compte connecté.
 * Email, rôle, état et secrets exclus (verrouillés dans la fiche).
 * La garde réelle est côté serveur.
 */
export function FormulaireMonProfil({
  nomInitial,
  telephoneInitial,
}: {
  nomInitial: string;
  telephoneInitial: string;
}) {
  const [resultat, action, enCours] = useActionState(
    modifierMonProfilAction,
    null as ResultatModificationMonProfil | null,
  );
  const [nom, setNom] = React.useState(nomInitial);
  const [telephone, setTelephone] = React.useState(telephoneInitial);
  const sale =
    nom.trim() !== nomInitial || telephone.trim() !== telephoneInitial;

  return (
    <form action={action} className="mt-3 flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="mon-profil-nom" className="mb-1.5 block text-xs font-medium">
            Nom affiché
          </label>
          <div className="group relative">
            <UserIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="mon-profil-nom"
              name="nom"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={255}
              value={nom}
              onChange={(event) => setNom(event.target.value)}
              className="rounded-lg pl-9"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="mon-profil-telephone"
            className="mb-1.5 block text-xs font-medium"
          >
            Téléphone contact
          </label>
          <div className="group relative">
            <PhoneIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="mon-profil-telephone"
              name="telephone"
              type="tel"
              autoComplete="tel"
              placeholder="+243 …"
              value={telephone}
              onChange={(event) => setTelephone(event.target.value)}
              className="rounded-lg pl-9"
            />
          </div>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Contact uniquement — jamais identifiant, jamais vérifié par SMS.
      </p>
      {resultat && !resultat.ok ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {resultat.erreur}
        </p>
      ) : null}
      {resultat?.ok ? (
        <p role="status" className="text-xs font-medium text-green-700">
          {resultat.inchange ? "Aucun changement." : "Coordonnées enregistrées."}
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
