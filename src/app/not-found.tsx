import type { Metadata } from "next";
import Link from "next/link";
import { EcranErreur } from "@/components/ecran-erreur";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page introuvable — TKS",
  description:
    "Cette page n'existe pas ou a été déplacée. Vos commandes, créances et paiements sont inchangés.",
};

/**
 * Page 404 (composant serveur : aucun JS client, affichable hors-ligne).
 * Vocabulaire GLOSSARY : commande, créance, paiement. Jamais shop,
 * réalisation, vente, facture ni virtuel.
 */
export default function Introuvable() {
  return (
    <EcranErreur
      code="404"
      titre="Cette page n'existe pas"
      message="L'adresse a peut-être changé ou a été mal saisie. Vos commandes, créances et paiements sont inchangés."
      actions={
        <>
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            Retour à l&apos;accueil
          </Link>
          <Link href="/aide" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Voir l&apos;aide
          </Link>
        </>
      }
    />
  );
}
