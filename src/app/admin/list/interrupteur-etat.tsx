"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  leverSuspensionAdministrateurAction,
  revoquerAdministrateurAction,
  suspendreAdministrateurAction,
} from "./actions";

/**
 * Interrupteur d'état d'un compte d'administration (design cartes).
 * VALIDE (ON) : cliquer propose suspendre (réversible) ou révoquer
 * (définitif). SUSPENDU : cliquer propose lever la suspension ou
 * révoquer. REVOQUE (OFF) : toujours désactivé, aucun retour. Le
 * titulaire ne touche jamais à son propre compte.
 */
export function InterrupteurEtat({
  id,
  nom,
  etat,
  desactive,
  motifDesactive,
}: {
  id: string;
  nom: string;
  etat: "VALIDE" | "SUSPENDU" | "REVOQUE";
  /** Switch non cliquable (ex. son propre compte). */
  desactive?: boolean;
  motifDesactive?: string;
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function agir(action: (id: string) => Promise<{ ok: boolean; erreur?: string }>) {
    setErreur(null);
    demarrer(async () => {
      const resultat = await action(id);
      if (resultat.ok) {
        setOuvert(false);
      } else {
        setErreur(
          "erreur" in resultat && typeof resultat.erreur === "string"
            ? resultat.erreur
            : "Opération impossible.",
        );
      }
    });
  }

  const valide = etat === "VALIDE";
  const suspendu = etat === "SUSPENDU";
  const cliquable = (valide || suspendu) && !desactive;

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(nouveau) => {
        setOuvert(nouveau);
        if (!nouveau) setErreur(null);
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={valide}
        aria-label={`Compte de ${nom} : ${valide ? "validé" : suspendu ? "suspendu" : "révoqué"}`}
        title={
          valide
            ? desactive
              ? (motifDesactive ?? "Action indisponible")
              : "Cliquer pour suspendre ou révoquer"
            : suspendu
              ? desactive
                ? (motifDesactive ?? "Action indisponible")
                : "Suspendu : cliquer pour lever ou révoquer"
              : "Révoqué définitivement"
        }
        disabled={!cliquable}
        onClick={() => setOuvert(true)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          valide ? "bg-primary" : "bg-input",
          cliquable
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-70",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
            valide && "translate-x-4",
          )}
        />
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {valide ? `Suspendre ${nom} ?` : `Lever la suspension de ${nom} ?`}
          </DialogTitle>
          <DialogDescription>
            {valide
              ? "Suspendu : le compte ne se connecte plus et ses sessions sont tuées aussitôt, mais la levée reste possible. La révocation, elle, est définitive."
              : "Le compte retrouve son accès. Sinon, la révocation reste possible — définitive, sans retour."}
          </DialogDescription>
        </DialogHeader>
        {erreur ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {erreur}
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:justify-between">
          <DialogClose render={<Button variant="outline" disabled={enCours} />}>
            Annuler
          </DialogClose>
          <div className="flex gap-2">
            {valide ? (
              <Button
                variant="secondary"
                onClick={() => agir(suspendreAdministrateurAction)}
                disabled={enCours}
              >
                {enCours ? "Suspension…" : "Suspendre"}
              </Button>
            ) : (
              <Button
                onClick={() => agir(leverSuspensionAdministrateurAction)}
                disabled={enCours}
              >
                {enCours ? "Levée…" : "Lever la suspension"}
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => agir(revoquerAdministrateurAction)}
              disabled={enCours}
            >
              {enCours ? "Révocation…" : "Révoquer définitivement"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
