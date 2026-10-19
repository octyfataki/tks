"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const modifie = Math.round(duree) !== dureeInvitationJours;
  const valeur = Math.min(Math.max(Math.round(duree), minJours), maxJours);
  const progression =
    ((valeur - minJours) / (maxJours - minJours)) * 100;

  return (
    <form action={action} className="flex">
      <Card className="min-w-0 flex-1">
      <CardHeader>
        <CardTitle>Validité des nouveaux liens</CardTitle>
        <CardDescription>
          Le délai laissé au destinataire pour créer son compte une fois le
          lien ouvert.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label htmlFor="dureeInvitation" className="text-xs font-medium">
              Durée de validité
            </label>
            <span aria-live="polite" className="text-sm font-semibold tabular-nums">
              {valeur} jour{valeur > 1 ? "s" : ""}
            </span>
          </div>
          <input
            id="dureeInvitation"
            name="dureeJours"
            type="range"
            min={minJours}
            max={maxJours}
            step={1}
            value={valeur}
            onChange={(event) => setDuree(Number(event.target.value))}
            aria-valuetext={`${valeur} jour${valeur > 1 ? "s" : ""}`}
            className="tks-range w-full"
            style={
              {
                "--tks-range-track": `linear-gradient(to right, var(--primary) 0 ${progression}%, var(--muted) ${progression}% 100%)`,
              } as React.CSSProperties
            }
          />
          <div
            aria-hidden
            className="mt-1 flex justify-between text-[11px] text-muted-foreground"
          >
            <span>{minJours} jour</span>
            <span>{maxJours} jours</span>
          </div>
        </div>

        {resultat && !resultat.ok ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/8 px-3 py-2 text-xs font-medium text-destructive"
          >
            {resultat.erreur}
          </p>
        ) : null}
        {resultat?.ok && !modifie ? (
          <p
            role="status"
            className="rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
          >
            {resultat.jours} jour{resultat.jours > 1 ? "s" : ""} enregistré
            {resultat.jours > 1 ? "s" : ""} — les prochains liens dureront
            autant.
          </p>
        ) : null}
        {modifie ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/25 bg-primary/[0.07] px-3 py-2.5">
            <p className="text-xs leading-relaxed">
              Passer de {dureeInvitationJours} jour
              {dureeInvitationJours > 1 ? "s" : ""} à {valeur}.{" "}
              <span className="text-muted-foreground">
                Valeur par défaut : {defautJours}.
              </span>
            </p>
            <Button type="submit" size="sm" disabled={enCours}>
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Valeur en vigueur : {dureeInvitationJours} jour
            {dureeInvitationJours > 1 ? "s" : ""}.
          </p>
        )}
      </CardContent>
      </Card>
    </form>
  );
}
