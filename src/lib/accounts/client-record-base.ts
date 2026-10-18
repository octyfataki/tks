import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import {
  comptesClients,
  piecesIdentiteClients,
} from "@/lib/db/schema/accounts";
import {
  lireFicheClient,
  statutPieceValide,
  type FicheClient,
  type LecteurFicheClient,
} from "./client-record";

export const lecteurFicheDb: LecteurFicheClient = {
  async lireIdentite(compteId) {
    const lignes = await db
      .select({
        id: comptesClients.id,
        email: comptesClients.email,
        telephone: comptesClients.telephone,
        etat: comptesClients.etat,
        inscritLe: comptesClients.createdAt,
        valideLe: comptesClients.valideLe,
        refuseMotif: comptesClients.refuseMotif,
        nom: user.name,
      })
      .from(comptesClients)
      .leftJoin(user, eq(user.id, comptesClients.betterAuthUserId))
      .where(eq(comptesClients.id, compteId))
      .limit(1);
    return lignes[0] ?? null;
  },

  async lirePieces(compteId) {
    const lignes = await db
      .select({
        id: piecesIdentiteClients.id,
        typePiece: piecesIdentiteClients.typePiece,
        mime: piecesIdentiteClients.mime,
        statutPiece: piecesIdentiteClients.statutPiece,
        refusMotif: piecesIdentiteClients.refusMotif,
        vuePar: piecesIdentiteClients.vuePar,
        vueLe: piecesIdentiteClients.vueLe,
        deposeLe: piecesIdentiteClients.createdAt,
      })
      .from(piecesIdentiteClients)
      .where(eq(piecesIdentiteClients.compteClientId, compteId))
      .orderBy(desc(piecesIdentiteClients.createdAt));
    return lignes.map((ligne) => ({
      ...ligne,
      statutPiece: statutPieceValide(ligne.statutPiece)
        ? ligne.statutPiece
        : ("EN_ATTENTE" as const),
    }));
  },
};

export function chargerFicheClient(compteId: string): Promise<FicheClient | null> {
  return lireFicheClient(lecteurFicheDb, compteId);
}