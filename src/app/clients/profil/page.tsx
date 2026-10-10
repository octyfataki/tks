import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { session as tableSession } from "@/lib/db/schema/auth-schema";
import {
  comptesClients,
  facteurs2faClients,
} from "@/lib/db/schema/s1-comptes";
import {
  ActivationSecondFacteur,
  ProfilUtilisateur,
  type SessionEnCoursProfil,
} from "@/components/profil";
import { and, desc, eq, gt } from "drizzle-orm";

// Mon compte (espace client) : le même composant ProfilUtilisateur, nourri
// par la session et les tables clients. Le dossier rattaché arrivera avec
// S4 ; en attendant, l'état vide normatif s'affiche (aucun dossier, aucun
// solde). Second facteur : optionnel, activé par le client lui-même depuis
// ici (compte VALIDE), code par SMS vers son téléphone ou par email
// (issue #3). La garde /clients n'y laisse entrer que les comptes VALIDE.
export default async function ClientsProfilPage() {
  const entetes = await headers();
  const session = await auth.api.getSession({ headers: entetes });
  const email = session?.user?.email ?? "";
  const userId = session?.user?.id;
  const sessionActuelleId =
    (session as unknown as { session?: { id?: string } } | null)?.session?.id ?? null;
  const nom =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Client";

  let telephone: string | null = null;
  let compteValide = false;
  let secondFacteurActif: boolean | null = null;
  let appareilSecondFacteur: string | null = null;

  if (userId) {
    const lignes = await db
      .select({ id: comptesClients.id, telephone: comptesClients.telephone, etat: comptesClients.etat })
      .from(comptesClients)
      .where(eq(comptesClients.betterAuthUserId, userId))
      .limit(1);
    const ligne = lignes[0];
    if (ligne) {
      telephone = ligne.telephone ?? null;
      compteValide = ligne.etat === "VALIDE";
      const facteurs = await db
        .select({ nomAppareil: facteurs2faClients.nomAppareil, actif: facteurs2faClients.actif })
        .from(facteurs2faClients)
        .where(eq(facteurs2faClients.compteClientId, ligne.id))
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

  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 py-8">
      <ProfilUtilisateur
        nom={nom}
        email={email || "Espace client"}
        telephone={telephone}
        compte={{ type: "CLIENT" }}
        dossier={null}
        secondFacteurActif={secondFacteurActif}
        appareilSecondFacteur={appareilSecondFacteur}
        sessions={sessions}
        sessionActuelleId={sessionActuelleId}
        formulaireSecondFacteur={
          compteValide && secondFacteurActif !== true ? (
            <ActivationSecondFacteur email={email} telephone={telephone} />
          ) : undefined
        }
      />
    </main>
  );
}
