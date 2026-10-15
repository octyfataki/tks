import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import { chargerFicheClient } from "@/lib/accounts/client-record-base";
import { etiquettesActivesParCompte } from "@/lib/annotations/annotations";
import { VueFicheClient } from "@/components/clients/fiche-client";

/**
 * /admin/clients/[id] — Fiche d'un compte client (issue #9).
 *
 * L'accès est déjà gardé par /admin/layout (administrateur principal ou
 * technique VALIDE) : un client ou un agent n'atteint jamais cette page.
 * Seul l'administrateur principal annote : le technique n'a aucun pouvoir
 * métier (GLOSSARY), il voit la fiche sans la zone de geste.
 * Un identifiant inconnu rend 404 — aucune fuite de données d'un autre
 * compte. La fiche ne montre jamais de solde, de dette ni de plafond.
 */
export default async function FicheCompteClientAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const [fiche, actives, lignes] = await Promise.all([
    chargerFicheClient(id),
    etiquettesActivesParCompte([id]),
    session?.user?.id
      ? db
          .select({ role: comptesStaff.role })
          .from(comptesStaff)
          .where(eq(comptesStaff.betterAuthUserId, session.user.id))
          .limit(1)
      : Promise.resolve([]),
  ]);
  if (!fiche) notFound();

  // Ouverture pré-remplie depuis le compte : nom et téléphone connus, pas
  // retapés. Réservée au distributeur : le technique n'a aucun pouvoir
  // métier, il garde la fiche sans le bouton.
  const preRempli = new URLSearchParams();
  if (fiche.nom?.trim()) preRempli.set("nom", fiche.nom.trim());
  preRempli.set("contact", fiche.telephone);
  const ouvrirDossierHref =
    lignes[0]?.role === "ADMIN_PRINCIPAL"
      ? `/admin/clients/new?${preRempli.toString()}`
      : null;

  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const maintenant = Date.now();

  return (
    <VueFicheClient
      fiche={fiche}
      maintenant={maintenant}
      listeHref="/admin/clients"
      etiquettesActives={actives.get(id) ?? []}
      peutAnnoter={lignes[0]?.role === "ADMIN_PRINCIPAL"}
      ouvrirDossierHref={ouvrirDossierHref}
    />
  );
}
