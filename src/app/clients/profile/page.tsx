import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { session as tableSession } from "@/lib/db/schema/auth-schema";
import {
  comptesClients,
  facteurs2faClients,
} from "@/lib/db/schema/accounts";
import {
  ActivationSecondFacteur,
  DesactivationSecondFacteur,
  ProfilUtilisateur,
  RemplacerPieceIdentite,
  type PieceIdentiteProfil,
  type SessionEnCoursProfil,
} from "@/components/profile";
import { lirePiecesCompte } from "@/lib/accounts/client-documents";
import { statutPieceValide } from "@/lib/accounts/client-record";
import { FormulaireMonProfil } from "@/app/admin/profile/my-profile-form";
import { and, desc, eq, gt } from "drizzle-orm";

export default async function ClientProfilePage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const email = session?.user?.email ?? "";
  const userId = session?.user?.id;
  const currentSessionId =
    (session as unknown as { session?: { id?: string } } | null)?.session?.id ?? null;
  const name =
    session?.user?.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "Client";
  const avatarUrl = session?.user?.image ?? null;

  let telephone: string | null = null;
  let isAccountValidated = false;
  let secondFactorEnabled: boolean | null = null;
  let secondFactorDevice: string | null = null;
  let identityDocuments: PieceIdentiteProfil[] | undefined;

  if (userId) {
    const rows = await db
      .select({ id: comptesClients.id, telephone: comptesClients.telephone, status: comptesClients.etat })
      .from(comptesClients)
      .where(eq(comptesClients.betterAuthUserId, userId))
      .limit(1);
    const row = rows[0];
    if (row) {
      telephone = row.telephone ?? null;
      isAccountValidated = row.status === "VALIDE";
      const factors = await db
        .select({ deviceName: facteurs2faClients.nomAppareil, actif: facteurs2faClients.actif })
        .from(facteurs2faClients)
        .where(eq(facteurs2faClients.compteClientId, row.id))
        .limit(1);
      const factor = factors[0];
      if (factor) {
        secondFactorEnabled = factor.actif;
        secondFactorDevice = factor.deviceName;
      } else {
        secondFactorEnabled = null;
      }
      const uploadedDocuments = await lirePiecesCompte(row.id);
      identityDocuments = uploadedDocuments.map((document) => ({
        id: document.id,
        typePiece: document.typePiece,
        mime: document.mime,
        statutPiece: statutPieceValide(document.statutPiece)
          ? document.statutPiece
          : "EN_ATTENTE",
        refusMotif: document.refusMotif,
        deposeLe: document.deposeLe,
      }));
    }
  }

  let sessions: SessionEnCoursProfil[] = [];
  if (userId) {
    const sessionRows = await db
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
    sessions = sessionRows;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 bg-background p-4 sm:p-6">
      <ProfilUtilisateur
        nom={name}
        email={email || "Espace client"}
        telephone={telephone}
        avatarUrl={avatarUrl}
        compte={{ type: "CLIENT" }}
        dossier={null}
        secondFacteurActif={secondFactorEnabled}
        appareilSecondFacteur={secondFactorDevice}
        piecesIdentite={identityDocuments}
        formulairePieceIdentite={<RemplacerPieceIdentite />}
        sessions={sessions}
        sessionActuelleId={currentSessionId}
        peutModifierCoordonnees={isAccountValidated}
        motifCoordonneesVerrouillees="Lecture seule : votre compte ne permet pas la correction."
        cleCoordonnees={`${name}-${telephone ?? ""}`}
        formulaireCoordonnees={
          <FormulaireMonProfil nomInitial={name} telephoneInitial={telephone ?? ""} />
        }
        formulaireSecondFacteur={
          isAccountValidated ? (
            secondFactorEnabled === true ? (
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
