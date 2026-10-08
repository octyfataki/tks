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
import { revoquerAgentAction } from "./actions";

/**
 * Interrupteur d'état d'un agent de service. ON = VALIDE : cliquer ouvre
 * une confirmation, la révocation est définitive (REVOQUE = inutilisable,
 * aucun retour). OFF = révoqué, toujours désactivé.
 */
export function InterrupteurAgent({
  id,
  nom,
  valide,
  desactive,
  motifDesactive,
}: {
  id: string;
  nom: string;
  valide: boolean;
  desactive?: boolean;
  motifDesactive?: string;
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function confirmer() {
    setErreur(null);
    demarrer(async () => {
      const resultat = await revoquerAgentAction(id);
      if (resultat.ok) {
        setOuvert(false);
      } else {
        setErreur(resultat.erreur);
      }
    });
  }

  const cliquable = valide && !desactive;

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
        aria-label={`Agent ${nom} : ${valide ? "validé" : "révoqué"}`}
        title={
          !valide
            ? "Révoqué définitivement"
            : desactive
              ? (motifDesactive ?? "Action indisponible")
              : "Cliquer pour révoquer"
        }
        disabled={!cliquable}
        onClick={() => setOuvert(true)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          valide ? "bg-primary" : "bg-input",
          cliquable ? "cursor-pointer" : "cursor-not-allowed opacity-70",
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
          <DialogTitle>Révoquer {nom} ?</DialogTitle>
          <DialogDescription>
            Le compte devient définitivement inutilisable (REVOQUE). Rouvrir
            un accès exigera révocation + recréation tracées. Ses permissions
            tombent avec le compte. Cette action ne peut pas être annulée.
          </DialogDescription>
        </DialogHeader>
        {erreur ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {erreur}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={enCours} />}>
            Annuler
          </DialogClose>
          <Button variant="destructive" onClick={confirmer} disabled={enCours}>
            {enCours ? "Révocation…" : "Révoquer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
