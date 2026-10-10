import { notFound } from "next/navigation";
import { chargerFicheClient } from "@/lib/s1-comptes/fiche-client-base";
import { VueFicheClient } from "@/components/clients/fiche-client";

/**
 * /admin/clients/[id] — Fiche d'un compte client (issue #9).
 *
 * L'accès est déjà gardé par /admin/layout (administrateur principal ou
 * technique VALIDE) : un client ou un agent n'atteint jamais cette page.
 * Un identifiant inconnu rend 404 — aucune fuite de données d'un autre
 * compte. La fiche ne montre jamais de solde, de dette ni de plafond.
 */
export default async function FicheCompteClientAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fiche = await chargerFicheClient(id);
  if (!fiche) notFound();

  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const maintenant = Date.now();

  return (
    <VueFicheClient
      fiche={fiche}
      maintenant={maintenant}
      listeHref="/admin/clients"
    />
  );
}
