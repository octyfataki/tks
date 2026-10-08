import { headers } from "next/headers";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import { comptesStaff, invitationsAgents, peutInviterAgent } from "@/lib/db/schema/s1-comptes";
import { Badge } from "@/components/ui/badge";
import {
  RegistreInvitationsAgents,
  type LigneInvitationAgent,
} from "./registre-invitations-agents";

/**
 * /admin/agents/invitations — Liens d'invitation agents (voie lien
 * uniquement : l'agent choisit lui-même email + mot de passe). Les comptes
 * déjà créés vivent dans /admin/agents.
 *
 * Lecture : tout administrateur validé (technique ou principal) voit le
 * registre. Écriture (nouveau lien, copier) : réservé à l'administrateur
 * principal validé (S1 : peutInviterAgent).
 */
export default async function InvitationsAgentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignesMoi = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignesMoi[0];
  const peutGerer = moi ? peutInviterAgent(moi.role, moi.etat) : false;

  const liensBruts = await db
    .select({
      id: invitationsAgents.id,
      jeton: invitationsAgents.jeton,
      expireLe: invitationsAgents.expireLe,
      consommeLe: invitationsAgents.consommeLe,
      creePar: invitationsAgents.creePar,
      createdAt: invitationsAgents.createdAt,
    })
    .from(invitationsAgents)
    .where(eq(invitationsAgents.roleCible, "AGENT"))
    .orderBy(desc(invitationsAgents.createdAt));

  const idsCreateurs = [...new Set(liensBruts.map((l) => l.creePar).filter(Boolean))];
  const createurs =
    idsCreateurs.length > 0
      ? await db
          .select({ id: comptesStaff.id, email: comptesStaff.email, nom: user.name })
          .from(comptesStaff)
          .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
          .where(inArray(comptesStaff.id, idsCreateurs))
      : [];
  const nomCreateur = new Map(createurs.map((c) => [c.id, c.nom?.trim() || c.email]));

  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const maintenant = Date.now();
  const lignes: LigneInvitationAgent[] = liensBruts.map((ligne) => ({
    id: ligne.id,
    jeton: ligne.jeton,
    envoyeLe: ligne.createdAt.toISOString(),
    expireLe: ligne.expireLe.toISOString(),
    etat:
      ligne.consommeLe !== null
        ? "termine"
        : ligne.expireLe.getTime() < maintenant
          ? "expire"
          : "en-attente",
    envoyePar: nomCreateur.get(ligne.creePar) ?? "Système",
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Invitations agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Liens à usage unique, durée limitée : l&apos;agent crée lui-même son
            compte via le lien, avec le rôle fixé agent de service.
          </p>
        </div>
        {!peutGerer ? (
          <Badge variant="outline" className="shrink-0">Lecture seule</Badge>
        ) : null}
      </div>
      <RegistreInvitationsAgents lignes={lignes} lectureSeule={!peutGerer} />
    </div>
  );
}
