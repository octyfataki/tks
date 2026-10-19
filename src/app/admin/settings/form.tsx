"use client";

import * as React from "react";
import { useActionState } from "react";
import { ClipboardListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  enregistrerDureeInvitationAction,
  type ResultatDureeInvitation,
} from "./actions";

const ETAT_INITIAL: ResultatDureeInvitation | null = null;

export function FormulaireParametres({
  dureeInvitationJours,
  minJours,
  maxJours,
  defautJours,
}: {
  dureeInvitationJours: number;
  minJours: number;
  maxJours: number;
  defautJours: number;
}) {
  const [resultat, action, enCours] = useActionState(
    enregistrerDureeInvitationAction,
    ETAT_INITIAL,
  );
  const [duree, setDuree] = React.useState(dureeInvitationJours);
  const modifie = duree !== dureeInvitationJours;
  const enregistre = resultat?.ok === true && !modifie ? resultat.jours : null;

  const progression = ((duree - minJours) / (maxJours - minJours)) * 100;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Paramètres</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Réglages généraux de l&apos;application. Chaque modification est tracée
          au journal d&apos;audit.
        </p>
      </div>

      {resultat && !resultat.ok ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {resultat.erreur}
        </p>
      ) : null}
      {enregistre !== null ? (
        <p
          role="status"
          className="text-xs font-medium text-green-700"
        >
          Durée enregistrée : {enregistre} jour{enregistre > 1 ? "s" : ""}.
        </p>
      ) : null}

      <form
        action={action}
        className="max-w-2xl rounded-xl border bg-card p-4 sm:p-5"
      >
        <h2 className="text-sm font-semibold">
          Durée de validité des liens d&apos;invitation
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          S&apos;applique aux liens qui créent un compte administrateur
          principal ou agent de service. Passé ce délai, le lien est refusé et
          un nouveau lien doit être envoyé.
        </p>

        <div className="mt-5">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <label htmlFor="dureeInvitation" className="text-xs font-medium">
              Validité des nouveaux liens
            </label>
            <span aria-live="polite" className="text-xs text-muted-foreground">
              {duree} jour{duree > 1 ? "s" : ""}
            </span>
          </div>
          <input
            id="dureeInvitation"
            name="dureeJours"
            type="range"
            min={minJours}
            max={maxJours}
            step={1}
            value={duree}
            onChange={(event) => setDuree(Number(event.target.value))}
            aria-valuetext={`${duree} jour${duree > 1 ? "s" : ""}`}
            className="tks-range w-full"
            style={
              {
                "--tks-range-track": `linear-gradient(to right, var(--primary) 0 ${progression}%, var(--muted) ${progression}% 100%)`,
              } as React.CSSProperties
            }
          />
          <div
            aria-hidden
            className="flex justify-between text-[11px] text-muted-foreground"
          >
            <span>{minJours} jour</span>
            <span>{maxJours} jours</span>
          </div>
        </div>

        {modifie ? (
          <p className="mt-4 text-[11px] text-muted-foreground">
            Nouvelle valeur : {duree} jour{duree > 1 ? "s" : ""}. Enregistrez
            pour l&apos;appliquer aux prochains liens.
          </p>
        ) : (
          <p className="mt-4 text-[11px] text-muted-foreground">
            Valeur par défaut : {defautJours} jour{defautJours > 1 ? "s" : ""}.
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={enCours || !modifie}>
            {enCours ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>

      <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
        <ClipboardListIcon className="size-3.5 shrink-0" />
        La durée s&apos;applique aussi aux durées pré-remplies sur les écrans
        d&apos;invitation.
      </p>
    </div>
  );
}
