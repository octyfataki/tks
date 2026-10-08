import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, invitationsAgents } from "@/lib/db/schema/s1-comptes";
import {
  peutInviterAdminPrincipal,
  peutInviterAgent,
} from "@/lib/db/schema/s1-comptes";
import { lireDureeInvitationJours } from "@/lib/s1-comptes/reglages";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FormulaireInvitationAdmin } from "../administrateurs/formulaire-invitation";
import { FormulaireInvitationAgent } from "./formulaire";

/**
 * /admin/invites — Invitations par lien (?cible=admin|agent, défaut agent).
 * Les deux voies partagent la même page car la sidebar y envoie les deux
 * entrées (« Inviter un administrateur principal » et « Inviter un
 * agent ») : un onglet par rôle cible, chacun avec son autorisation S1.
 * Le lien fixe le rôle, jamais l'identifiant : la personne choisit
 * elle-même son email et son mot de passe. Usage unique, durée [1, 30].
 *
 * Le shell SidebarProvider + AdminHeader vit dans /admin/layout : ici,
 * uniquement le contenu.
 */
export default async function InviterPage({
  searchParams,
}: {
  searchParams: Promise<{ cible?: string }>;
}) {
  const { cible } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignes = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignes[0];
  const peutInviterAdmin = moi
    ? peutInviterAdminPrincipal(moi.role, moi.etat)
    : false;
  const peutInviterAgentRole = moi ? peutInviterAgent(moi.role, moi.etat) : false;

  if (!peutInviterAdmin && !peutInviterAgentRole) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        Seul un administrateur principal ou technique validé peut inviter un
        membre du personnel.
      </p>
    );
  }

  const invitationsPromise = peutInviterAgentRole
    ? db
        .select({
          id: invitationsAgents.id,
          jeton: invitationsAgents.jeton,
          expireLe: invitationsAgents.expireLe,
          consommeLe: invitationsAgents.consommeLe,
        })
        .from(invitationsAgents)
        .where(eq(invitationsAgents.roleCible, "AGENT"))
        .orderBy(desc(invitationsAgents.createdAt))
    : Promise.resolve([]);

  const invitationsAdminPromise = peutInviterAdmin
    ? db
        .select({
          id: invitationsAgents.id,
          jeton: invitationsAgents.jeton,
          expireLe: invitationsAgents.expireLe,
          consommeLe: invitationsAgents.consommeLe,
        })
        .from(invitationsAgents)
        .where(eq(invitationsAgents.roleCible, "ADMIN_PRINCIPAL"))
        .orderBy(desc(invitationsAgents.createdAt))
    : Promise.resolve([]);

  const [invitations, invitationsAdmin, defautDureeInvitation] =
    await Promise.all([
      invitationsPromise,
      invitationsAdminPromise,
      lireDureeInvitationJours(),
    ]);

  const seulOnglet = peutInviterAdmin && !peutInviterAgentRole ? "admin" : null;

  // Un seul rôle autorisé (administrateur technique) : pas d'onglets,
  // le formulaire suffit.
  if (seulOnglet) {
    return (
      <div className="flex flex-1 flex-col">
        <FormulaireInvitationAdmin
          defautJours={defautDureeInvitation}
          invitations={invitationsAdmin}
        />
      </div>
    );
  }

  const ongletDefaut =
    cible === "admin" && peutInviterAdmin ? "admin" : "agent";

  return (
    <div className="flex flex-1 flex-col">
      {/* key = remonte l'onglet quand ?cible change : defaultValue seul est
          ignoré après le premier montage en navigation client (sidebar
          « Inviter un administrateur principal » ↔ « Inviter un agent »). */}
      <Tabs
        key={ongletDefaut}
        defaultValue={ongletDefaut}
        className="flex flex-1 flex-col"
      >
        <div className="px-4 pt-4">
          <TabsList aria-label="Qui inviter">
            {peutInviterAdmin ? (
              <TabsTrigger value="admin">
                Administrateur principal
              </TabsTrigger>
            ) : null}
            {peutInviterAgentRole ? (
              <TabsTrigger value="agent">Agent de service</TabsTrigger>
            ) : null}
          </TabsList>
        </div>
        {peutInviterAdmin ? (
          <TabsContent value="admin">
            <FormulaireInvitationAdmin
              defautJours={defautDureeInvitation}
              invitations={invitationsAdmin}
            />
          </TabsContent>
        ) : null}
        {peutInviterAgentRole ? (
          <TabsContent value="agent">
            <FormulaireInvitationAgent
              defautJours={defautDureeInvitation}
              invitations={invitations}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
