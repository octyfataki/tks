"use client";

import { useEffect } from "react";
import Link from "next/link";
import { EcranErreur } from "@/components/ecran-erreur";
import { Button, buttonVariants } from "@/components/ui/button";

type ErreurSegmentProps = {
  error: Error & { digest?: string };
  /** Next 16 passe `retry`, les versions précédentes `reset` : accepter les deux. */
  reset?: () => void;
  retry?: () => void;
};

/**
 * Frontière d'erreur du segment (doit être un composant client).
 * `retry` relance le rendu serveur puis réinitialise la frontière ;
 * repli sur `reset` quand `retry` est absent. Journalise côté console
 * pour l'administrateur technique, sans exposer de trace à l'utilisateur.
 */
export default function ErreurSegment({ error, reset, retry }: ErreurSegmentProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const relancer = retry ?? reset;

  function reessayer(): void {
    if (!relancer) return;
    relancer();
  }

  const message =
    error.digest !== undefined
      ? `Réessayez. Si le problème persiste, revenez plus tard : vos commandes, créances et paiements sont inchangés. Référence : ${error.digest}.`
      : "Réessayez. Si le problème persiste, revenez plus tard : vos commandes, créances et paiements sont inchangés.";

  return (
    <EcranErreur
      code="Erreur"
      tonalite="erreur"
      titre="Quelque chose s'est mal passé"
      message={message}
      actions={
        <>
          <Button size="lg" onClick={reessayer}>
            Réessayer
          </Button>
          <Link href="/" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Retour à l&apos;accueil
          </Link>
        </>
      }
    />
  );
}
