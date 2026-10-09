import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, peutInviterAgent } from "@/lib/db/schema/s1-comptes";
import { PermissionRefusee } from "@/components/permission-refusee";
import { listerSocle } from "@/lib/s2-autorisations/autorisations";
import { SoclePermissions } from "./matrice-permissions";

/**
 * /admin/agents/permissions — Socle de base commun à tous les agents.
 * Ce qui est accordé ici s'applique à tous les agents de service, y
 * compris ceux créés après. L'individuel (fiche de chaque agent) ne fait
 * qu'ajouter des exceptions. Effectif = socle ∪ individuel.
 * Lecture seule sans le droit de gérer (S2 : seul un administrateur
 * principal VALIDE accorde — les bascules appellent les server actions
 * qui recontrôlent).
 */
export default async function PermissionsGlobalesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignesMoi = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignesMoi[0];
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
    return (
      <PermissionRefusee
        titre="Permissions des agents"
        detail="Seul un administrateur principal validé gère les permissions des agents de service. Votre rôle technique ne permet pas d'accorder ou de retirer des droits."
        action="Pour modifier les permissions, contactez un administrateur principal."
      />
    );
  }

  const socle = await listerSocle();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4 sm:p-6">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Accès
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Permissions de base des agents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Le socle commun à tous les agents de service : ce qui est accordé
          ici s&apos;applique à chacun, y compris aux agents créés après.
          Pour un cas particulier, ajoutez une exception sur la fiche de
          l&apos;agent. Chaque bascule est tracée au journal.
        </p>
      </div>
      <SoclePermissions initiales={socle} />
    </div>
  );
}
