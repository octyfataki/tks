"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  creerLienInvitationAdminAction,
  type ResultatInvitationAdmin,
} from "./actions";

const ETAT_INITIAL: ResultatInvitationAdmin | null = null;

export function FormulaireInvitationAdmin({
  defautJours,
}: {
  /** Durée pré-remplie : le réglage en vigueur (/admin/parametres). */
  defautJours: number;
}) {
  const [resultat, action, enCours] = useActionState(
    creerLienInvitationAdminAction,
    ETAT_INITIAL,
  );

  return (
    <form action={action}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="dureeJours">
            Durée de validité (jours)
          </FieldLabel>
          <Input
            id="dureeJours"
            name="dureeJours"
            type="number"
            min={1}
            max={30}
            defaultValue={defautJours}
            required
          />
          <FieldDescription>
            Passé l&apos;expiration, le lien est refusé visiblement et un
            nouveau lien doit être envoyé. Usage unique : déjà utilisé =
            refusé.
          </FieldDescription>
        </Field>
        {resultat && !resultat.ok ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {resultat.erreur}
          </p>
        ) : null}
        {resultat?.ok ? (
          <p role="status" className="text-xs font-medium break-all">
            Lien créé :{" "}
            <span className="font-mono">{resultat.lien}</span> — envoyez-le à
            la personne, qui choisira elle-même son email et son mot de passe.
          </p>
        ) : null}
        <Field>
          <Button type="submit" size="lg" className="w-full" disabled={enCours}>
            {enCours ? "Génération…" : "Générer le lien d'invitation"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
