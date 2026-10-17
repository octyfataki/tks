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

async function getConnectedAgent(): Promise<{ id: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const rows = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export default async function AgentClientRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const agent = await getConnectedAgent();
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
  const record = await chargerFicheClient(id);
  if (!record) notFound();
  const [activeLabels, canAnnotate] = await Promise.all([
    etiquettesActivesParCompte([id]),
    aPermission(agent.id, "client.annoter"),
  ]);

  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const now = Date.now();

  return (
    <VueFicheClient
      fiche={record}
      maintenant={now}
      listeHref="/agent/clients"
      etiquettesActives={activeLabels.get(id) ?? []}
      peutAnnoter={canAnnotate}
    />
  );
}