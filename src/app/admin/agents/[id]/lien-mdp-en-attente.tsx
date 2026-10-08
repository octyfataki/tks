import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { etatLienInvitation, premiersAccesAdmin } from "@/lib/db/schema/s1-comptes";
import { BoutonRevoquerLien } from "./bouton-revoquer-lien";

function dateHeure(valeur: Date): string {
  return valeur.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Dernier lien de mot de passe de l'agent, s'il n'est ni consommé ni
 * révoqué : rappel d'expiration + coupe-circuit. Rien se s'affiche
 * quand aucun lien ne court — le formulaire de génération vit juste
 * au-dessus, dans la même zone.
 */
export async function LienMotDePasseEnAttente({ agentId }: { agentId: string }) {
  const lignes = await db
    .select({
      id: premiersAccesAdmin.id,
      expireLe: premiersAccesAdmin.expireLe,
      consommeLe: premiersAccesAdmin.consommeLe,
      revoqueLe: premiersAccesAdmin.revoqueLe,
    })
    .from(premiersAccesAdmin)
    .where(eq(premiersAccesAdmin.compteStaffCible, agentId))
    .orderBy(desc(premiersAccesAdmin.createdAt))
    .limit(1);
  const lien = lignes[0];
  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const etat = lien ? etatLienInvitation(lien, Date.now()) : null;
  if (!lien || etat === "termine" || etat === "revoque") return null;

  return (
    <div className="mt-3 rounded-lg border px-3 py-2 text-xs">
      {etat === "en-attente" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground">
            Un lien court jusqu&apos;au {dateHeure(lien.expireLe)}.
          </p>
          <BoutonRevoquerLien accesId={lien.id} />
        </div>
      ) : (
        <p className="text-muted-foreground">
          Dernier lien expiré le {dateHeure(lien.expireLe)} — générez-en un
          nouveau ci-dessous.
        </p>
      )}
    </div>
  );
}
