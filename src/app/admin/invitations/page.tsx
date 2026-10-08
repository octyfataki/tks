import { headers } from "next/headers";
import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import {
  comptesStaff,
  invitationsAgents,
  peutInviterAdminPrincipal,
  premiersAccesAdmin,
} from "@/lib/db/schema/s1-comptes";
import { PermissionRefusee } from "@/components/permission-refusee";
import { RegistreInvitations, type LigneRegistre } from "./registre-invitations";
import { etatLienInvitation } from "@/lib/db/schema/s1-comptes/validation";

/**
 * /admin/invitations — Registre unique des invitations envoyées pour un
 * compte administrateur principal (le distributeur). Liens à faire suivre
 * (l'invité remplit tout via /invite/[jeton]) et fiches déjà remplies
 * (nom, email, téléphone renseignés à la création, reste le mot de passe
 * via /premier-acces/[jeton]) y sont mélangés : c'est la voie, pas la
 * table d'origine, qui organise la lecture.
 *
 * Les comptes créés avec mot de passe transmis directement n'apparaissent
 * pas ici : il n'y a plus rien en attente, leur place est dans /admin/list.
 * Réservé à un administrateur technique ou principal VALIDE (S1 :
 * peutInviterAdminPrincipal — même règle que la création directe).
 */
export default async function InvitationsEnvoyeesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? "";
  const lignesMoi = userId
    ? await db
        .select({ role: comptesStaff.role, etat: comptesStaff.etat })
        .from(comptesStaff)
        .where(eq(comptesStaff.betterAuthUserId, userId))
    : [];
  const moi = lignesMoi[0];
  const autorise = moi
    ? peutInviterAdminPrincipal(moi.role, moi.etat)
    : false;

  if (!autorise) {
    return (
      <PermissionRefusee
        titre="Invitations envoyées"
        detail="Seul un administrateur technique ou un administrateur principal validé peut voir les invitations envoyées."
        action="Votre rôle ne permet pas de consulter ce registre."
      />
    );
  }

  const liensBrutsPromise = db
    .select({
      id: invitationsAgents.id,
      jeton: invitationsAgents.jeton,
      expireLe: invitationsAgents.expireLe,
      consommeLe: invitationsAgents.consommeLe,
      revoqueLe: invitationsAgents.revoqueLe,
      creePar: invitationsAgents.creePar,
      createdAt: invitationsAgents.createdAt,
    })
    .from(invitationsAgents)
    .where(eq(invitationsAgents.roleCible, "ADMIN_PRINCIPAL"))
    .orderBy(desc(invitationsAgents.createdAt));

  const accesBrutsPromise = db
    .select({
      id: premiersAccesAdmin.id,
      jeton: premiersAccesAdmin.jeton,
      expireLe: premiersAccesAdmin.expireLe,
      consommeLe: premiersAccesAdmin.consommeLe,
      revoqueLe: premiersAccesAdmin.revoqueLe,
      creePar: premiersAccesAdmin.creePar,
      createdAt: premiersAccesAdmin.createdAt,
      cibleId: comptesStaff.id,
      cibleEmail: comptesStaff.email,
      cibleTelephone: comptesStaff.telephone,
      cibleNom: user.name,
    })
    .from(premiersAccesAdmin)
    .innerJoin(comptesStaff, eq(comptesStaff.id, premiersAccesAdmin.compteStaffCible))
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
    .where(eq(comptesStaff.role, "ADMIN_PRINCIPAL"))
    .orderBy(desc(premiersAccesAdmin.createdAt));

  const [liensBruts, accesBruts] = await Promise.all([
    liensBrutsPromise,
    accesBrutsPromise,
  ]);

  const idsCreateurs = [
    ...new Set(
      [...liensBruts, ...accesBruts].map((l) => l.creePar).filter(Boolean),
    ),
  ];
  const createurs =
    idsCreateurs.length > 0
      ? await db
          .select({
            id: comptesStaff.id,
            email: comptesStaff.email,
            nom: user.name,
          })
          .from(comptesStaff)
          .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
          .where(inArray(comptesStaff.id, idsCreateurs))
      : [];
  const nomCreateur = new Map(
    createurs.map((c) => [c.id, c.nom?.trim() || c.email]),
  );

  // Horloge lue une fois par requête (composant serveur) : stable pendant
  // le rendu, pas de re-rendu imprévisible côté serveur.
  // eslint-disable-next-line react-hooks/purity -- lecture unique de l'horloge en composant serveur
  const maintenant = Date.now();
  const lignes: LigneRegistre[] = [
    ...liensBruts.map(
      (ligne): LigneRegistre => ({
        voie: "lien",
        id: ligne.id,
        jeton: ligne.jeton,
        envoyeLe: ligne.createdAt.toISOString(),
        expireLe: ligne.expireLe.toISOString(),
        etat: etatLienInvitation(
          {
            consommeLe: ligne.consommeLe,
            revoqueLe: ligne.revoqueLe,
            expireLe: ligne.expireLe,
          },
          maintenant,
        ),
        envoyePar: nomCreateur.get(ligne.creePar) ?? "Système (bootstrap)",
      }),
    ),
    ...accesBruts.map(
      (ligne): LigneRegistre => ({
        voie: "fiche",
        id: ligne.id,
        cibleId: ligne.cibleId,
        nom:
          ligne.cibleNom?.trim() ||
          ligne.cibleEmail.split("@")[0] ||
          "Sans nom",
        email: ligne.cibleEmail,
        telephone: ligne.cibleTelephone,
        jeton: ligne.jeton,
        envoyeLe: ligne.createdAt.toISOString(),
        expireLe: ligne.expireLe.toISOString(),
        etat: etatLienInvitation(
          {
            consommeLe: ligne.consommeLe,
            revoqueLe: ligne.revoqueLe,
            expireLe: ligne.expireLe,
          },
          maintenant,
        ),
        envoyePar: nomCreateur.get(ligne.creePar) ?? "Système (bootstrap)",
      }),
    ),
  ].sort((a, b) => b.envoyeLe.localeCompare(a.envoyeLe));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4 sm:p-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          Invitations envoyées
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tout l&apos;embarquement en cours des administrateurs principaux :
          les liens à faire suivre et les fiches déjà remplies qui attendent
          encore leur mot de passe.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ici, seuls les liens administrateurs principaux. Les liens agents
          vivent dans{" "}
          <Link href="/admin/agents/invitations" className="underline-offset-4 hover:underline">
            Invitations agents
          </Link>
          .
        </p>
      </div>
      <RegistreInvitations lignes={lignes} />
    </div>
  );
}
