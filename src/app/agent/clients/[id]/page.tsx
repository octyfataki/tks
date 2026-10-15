import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { aPermission } from "@/lib/s2-autorisations/autorisations";
import { chargerFicheClient } from "@/lib/s1-comptes/fiche-client-base";
import { etiquettesActivesParCompte } from "@/lib/s4-annotations/annotations";
import { VueFicheClient } from "@/components/clients/fiche-client";
import { PermissionRefusee } from "@/components/permission-refusee";

async function agentConnecte(): Promise<{ id: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  return lignes[0] ?? null;
}

export default async function FicheCompteClientAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const agent = await agentConnecte();
  if (!agent || !(await aPermission(agent.id, "client.valider"))) {
    return (
      <PermissionRefusee
        titre="Fiche client réservée"
        detail="Seuls les agents autorisés à valider les comptes clients peuvent ouvrir une fiche."
        action="Demandez à l'administrateur principal la permission « client.valider »."
      />
    );
  }

  const { id } = await params;
  const fiche = await chargerFicheClient(id);
  if (!fiche) notFound();
  const [actives, peutAnnoter] = await Promise.all([
    etiquettesActivesParCompte([id]),
    aPermission(agent.id, "client.annoter"),
  ]);

  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const maintenant = Date.now();

  return (
    <VueFicheClient
      fiche={fiche}
      maintenant={maintenant}
      listeHref="/agent/clients"
      etiquettesActives={actives.get(id) ?? []}
      peutAnnoter={peutAnnoter}
    />
  );
}
