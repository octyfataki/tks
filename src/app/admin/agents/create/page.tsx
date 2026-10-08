import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, peutInviterAgent } from "@/lib/db/schema/s1-comptes";
import { PermissionRefusee } from "@/components/permission-refusee";
import { FormulaireAgent } from "./formulaire-agent";

/**
 * /admin/agents/create — Créer un agent de service en direct (comptoir).
 * Réservé à un administrateur principal VALIDE (S1 : peutInviterAgent).
 * L'autre voie reste le lien d'invitation (/admin/invites, onglet agent)
 * pour un agent distant qui crée lui-même son compte.
 */
export default async function CreerAgentPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignes = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignes[0];
  const peutCreer = moi ? peutInviterAgent(moi.role, moi.etat) : false;

  return (
    <div className="flex flex-1 flex-col">
      {peutCreer ? (
        <FormulaireAgent />
      ) : (
        <PermissionRefusee
          titre="Créer un agent de service"
          detail="Seul un administrateur principal validé peut créer un agent de service. Votre rôle technique ne permet pas d'ajouter des comptes."
          action="Pour créer un agent, contactez un administrateur principal."
        />
      )}
    </div>
  );
}
