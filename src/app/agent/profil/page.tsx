import type { CompteProfil, SessionEnCoursProfil } from "@/components/profil";
import { ProfilUtilisateur } from "@/components/profil";
import { profilSession } from "@/lib/s1-comptes/profil-session";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { session as tableSession, user } from "@/lib/db/schema/auth-schema";
import { comptesStaff, facteurs2faAdmin } from "@/lib/db/schema/s1-comptes";
import { FormulaireMonProfil } from "@/app/admin/profil/formulaire-mon-profil";
import { ActivationSecondFacteur, DesactivationSecondFacteur } from "@/components/profil";
import { and, desc, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";

// Mon compte (espace agent) : contenu seul, la coquille navigation +
// AgentHeader vit dans /agent/layout. Même ProfilUtilisateur que
// l'espace distributeur, nourri par la session et les tables staff.
// Modifiables par l'agent lui-même (compte VALIDE) : nom, téléphone,
// photo, autres sessions. Second facteur : optionnel, activé par
// l'agent lui-même depuis ici (compte VALIDE), comme les autres
// profils (issue #3).
export default async function AgentProfilPage() {
  const entetes = await headers();
  const session = await auth.api.getSession({ headers: entetes });
  const email = session?.user?.email ?? "";
  const userId = session?.user?.id;
  const sessionActuelleId =
    (session as unknown as { session?: { id?: string } } | null)?.session?.id ?? null;
  const nom =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Agent de service";
  const avatarUrl = session?.user?.image ?? null;

  const profil = await profilSession();
  const compte: CompteProfil =
    profil.type === "STAFF"
      ? { type: "STAFF", role: profil.role, etat: profil.etat }
      : { type: "CLIENT" };

  // Données réelles du compte connecté : téléphone, matricule, ancienneté,
  // second facteur. Replis neutres si illisible : on n'invente rien.
  let telephone: string | null = null;
  let matricule: string | null = null;
  let creeLe: Date | null = null;
  let creePar: string | null = null;
  let secondFacteurActif: boolean | null = null;
  let appareilSecondFacteur: string | null = null;

  if (userId && profil.type === "STAFF") {
    const lignes = await db
      .select({
        id: comptesStaff.id,
        telephone: comptesStaff.telephone,
        createdAt: comptesStaff.createdAt,
        creePar: comptesStaff.creePar,
        nom: user.name,
      })
      .from(comptesStaff)
      .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
      .where(eq(comptesStaff.betterAuthUserId, userId))
      .limit(1);
    const ligne = lignes[0];
    if (ligne) {
      telephone = ligne.telephone ?? null;
      matricule = ligne.id.slice(0, 8).toUpperCase();
      creeLe = ligne.createdAt;
      if (ligne.creePar) {
        const createurs = await db
          .select({ email: comptesStaff.email, nom: user.name })
          .from(comptesStaff)
          .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
          .where(eq(comptesStaff.id, ligne.creePar))
          .limit(1);
        const createur = createurs[0];
        creePar = createur
          ? createur.nom?.trim() || createur.email || "Compte supprimé"
          : "Compte supprimé";
      } else {
        creePar = "Système (bootstrap)";
      }
      const facteurs = await db
        .select({ nomAppareil: facteurs2faAdmin.nomAppareil, actif: facteurs2faAdmin.actif })
        .from(facteurs2faAdmin)
        .where(eq(facteurs2faAdmin.compteStaffId, ligne.id))
        .limit(1);
      const facteur = facteurs[0];
      if (facteur) {
        secondFacteurActif = facteur.actif;
        appareilSecondFacteur = facteur.nomAppareil;
      } else {
        secondFacteurActif = null;
      }
    }
  }

  // Sessions encore valides du compte connecté : d'où on est connecté,
  // depuis quand, jusqu'à quand. Le secret ne s'affiche jamais.
  let sessions: SessionEnCoursProfil[] = [];
  if (userId) {
    const lignesSessions = await db
      .select({
        id: tableSession.id,
        appareil: tableSession.userAgent,
        adresse: tableSession.ipAddress,
        creeLe: tableSession.createdAt,
        expireLe: tableSession.expiresAt,
      })
      .from(tableSession)
      .where(and(eq(tableSession.userId, userId), gt(tableSession.expiresAt, new Date())))
      .orderBy(desc(tableSession.createdAt))
      .limit(20);
    sessions = lignesSessions;
  }

  // Auto-correction autorisée sur son propre compte VALIDE, tous rôles
  // staff (garde réelle côté modifierMonProfilAction).
  const peutModifierCoordonnees =
    profil.type === "STAFF" && profil.etat === "VALIDE";

  return (
    <div className="flex flex-1 flex-col bg-background px-6 py-8">
      <ProfilUtilisateur
        nom={nom}
        email={email || "Espace agent"}
        telephone={telephone}
        avatarUrl={avatarUrl}
        compte={compte}
        dossier={null}
        secondFacteurActif={secondFacteurActif}
        appareilSecondFacteur={appareilSecondFacteur}
        matricule={matricule}
        creeLe={creeLe}
        creePar={creePar}
        sessions={sessions}
        peutModifierCoordonnees={peutModifierCoordonnees}
        motifCoordonneesVerrouillees="Lecture seule : votre compte ne permet pas la correction."
        cleCoordonnees={`${nom}-${telephone ?? ""}`}
        formulaireCoordonnees={
          <FormulaireMonProfil nomInitial={nom} telephoneInitial={telephone ?? ""} />
        }
        sessionActuelleId={sessionActuelleId}
        formulaireSecondFacteur={
          profil.type === "STAFF" && profil.etat === "VALIDE" ? (
            secondFacteurActif === true ? (
              <DesactivationSecondFacteur />
            ) : (
              <ActivationSecondFacteur email={email} telephone={telephone} />
            )
          ) : undefined
        }
      />
    </div>
  );
}
