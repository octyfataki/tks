"use client";

import { useEffect } from "react";
import Link from "next/link";
import { EcranErreur } from "@/components/ecran-erreur";
import { Button, buttonVariants } from "@/components/ui/button";

type ErreurGlobaleProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
};

/**
 * Frontière d'erreur racine : remplace le layout quand celui-ci échoue,
 * donc rend ses propres balises <html> et <body>. Même contenu que la
 * frontière de segment, coquille autonome sans dépendance au layout.
 */
export default function ErreurGlobale({ error, reset, retry }: ErreurGlobaleProps) {
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
    <html lang="fr">
      <body className="min-h-dvh bg-background text-foreground antialiased">
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
      </body>
    </html>
  );
}
