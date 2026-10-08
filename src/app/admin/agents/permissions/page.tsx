import { headers } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesStaff, peutInviterAgent } from "@/lib/db/schema/s1-comptes";
import { permissionsAgents } from "@/lib/db/schema/s2-autorisations";
import { estPermissionConnue } from "@/lib/db/schema/s2-autorisations";
import { nomAffiche } from "../../list/affichage-admin";
import { PermissionRefusee } from "@/components/permission-refusee";
import { MatricePermissions } from "./matrice-permissions";

/**
 * /admin/agents/permissions — Matrice globale : tous les agents validés,
 * leurs permissions du quotidien en bascules rapides, profil d'embauche en
 * un clic. Lecture seule sans le droit de gérer (S2 : seul un
 * administrateur principal VALIDE accorde — les bascules appellent les
 * server actions qui recontrôlent).
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

  const lignesAgents = await db
    .select({
      id: comptesStaff.id,
      email: comptesStaff.email,
      etat: comptesStaff.etat,
      nom: user.name,
    })
    .from(comptesStaff)
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
    .where(eq(comptesStaff.role, "AGENT"));

  const ids = lignesAgents.filter((l) => l.etat === "VALIDE").map((l) => l.id);
  const lignesPermissions =
    ids.length > 0
      ? await db
          .select({
            agentId: permissionsAgents.agentId,
            permission: permissionsAgents.permission,
          })
          .from(permissionsAgents)
          .where(inArray(permissionsAgents.agentId, ids))
      : [];
  const parAgent = new Map<string, string[]>();
  for (const ligne of lignesPermissions) {
    if (!estPermissionConnue(ligne.permission)) continue;
    const liste = parAgent.get(ligne.agentId) ?? [];
    liste.push(ligne.permission);
    parAgent.set(ligne.agentId, liste);
  }

  const initiales = lignesAgents
    .filter((l) => l.etat === "VALIDE")
    .map((l) => ({
      id: l.id,
      nom: nomAffiche({ nom: l.nom, email: l.email }),
      email: l.email,
      permissions: (parAgent.get(l.id) ?? []).sort(),
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4 sm:p-6">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Accès
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Permissions des agents
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue d&apos;ensemble du quotidien : qui peut créer, prendre, servir,
          encaisser. Chaque bascule est tracée au journal.
        </p>
      </div>
      <MatricePermissions initiales={initiales} />
    </div>
  );
}
