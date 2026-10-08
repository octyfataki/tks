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
import { revoquerAdministrateurAction } from "../actions";

/**
 * Zone dangereuse (bas de fiche) : révocation définitive d'un compte
 * d'administration, volontairement éloignée des gestes courants.
 * Confirmation exigée, jamais sur son propre compte, jamais sur un
 * compte déjà révoqué.
 */
export function BoutonRevocation({
  id,
  nom,
  revoque,
  desactive,
  motifDesactive,
}: {
  id: string;
  nom: string;
  revoque: boolean;
  desactive?: boolean;
  motifDesactive?: string;
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function confirmer() {
    setErreur(null);
    demarrer(async () => {
      const resultat = await revoquerAdministrateurAction(id);
      if (resultat.ok) {
        setOuvert(false);
      } else {
        setErreur(resultat.erreur);
      }
    });
  }

  const cliquable = !revoque && !desactive;

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(nouveau) => {
        setOuvert(nouveau);
        if (!nouveau) setErreur(null);
      }}
    >
      <Button
        type="button"
        variant="destructive"
        disabled={!cliquable}
        title={
          revoque
            ? "Révoqué définitivement"
            : desactive
              ? (motifDesactive ?? "Action indisponible")
              : "Révoquer définitivement ce compte"
        }
        onClick={() => setOuvert(true)}
      >
        {revoque ? "Compte révoqué" : "Révoquer définitivement"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Révoquer {nom} ?</DialogTitle>
          <DialogDescription>
            Le compte devient définitivement inutilisable (REVOQUE). Rouvrir
            un accès exigera révocation + recréation tracées. Cette action
            ne peut pas être annulée.
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
          <Button
            variant="destructive"
            onClick={confirmer}
            disabled={enCours}
          >
            {enCours ? "Révocation…" : "Oui, révoquer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
