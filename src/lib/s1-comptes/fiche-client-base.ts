// Fiche d'un compte client (issue #9) : lecteur réel, branché sur la base.
// Séparé du module pur `fiche-client.ts` pour que ce dernier reste testable
// sans DATABASE_URL. Un compte est une connexion ; jamais de solde.

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { user } from "@/lib/db/schema/auth-schema";
import {
  comptesClients,
  piecesIdentiteClients,
} from "@/lib/db/schema/s1-comptes";
import {
  lireFicheClient,
  type FicheClient,
  type LecteurFicheClient,
} from "./fiche-client";

/** Lecteur réel : identité du compte, puis ses pièces (récentes d'abord). */
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
    return db
      .select({
        id: piecesIdentiteClients.id,
        typePiece: piecesIdentiteClients.typePiece,
        mime: piecesIdentiteClients.mime,
        vuePar: piecesIdentiteClients.vuePar,
        vueLe: piecesIdentiteClients.vueLe,
        deposeLe: piecesIdentiteClients.createdAt,
      })
      .from(piecesIdentiteClients)
      .where(eq(piecesIdentiteClients.compteClientId, compteId))
      .orderBy(desc(piecesIdentiteClients.createdAt));
  },
};

/** Charge la fiche d'un compte depuis la base. Identifiant inconnu → null. */
export function chargerFicheClient(compteId: string): Promise<FicheClient | null> {
  return lireFicheClient(lecteurFicheDb, compteId);
}
