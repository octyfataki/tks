import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { comptesClients, piecesIdentiteClients } from "@/lib/db/schema/accounts";
import {
  verdictFichierPiece,
  etatPieceDeposable,
  typePieceValide,
} from "./document-files";
import type { StatutPiece } from "./client-record";
import { lignesEcrites } from "./mysql-result";

export type ErreurPiece =
  | "NON_AUTORISE"
  | "COMPTE_NON_ELIGIBLE"
  | "TYPE_PIECE_INVALIDE"
  | "FICHIER_REFUSE"
  | "STOCKAGE_INDISPONIBLE";

export class PieceError extends Error {
  code: ErreurPiece;
  constructor(code: ErreurPiece, message: string) {
    super(message);
    this.code = code;
  }
}

export async function compteClientConnecte(): Promise<{
  id: string;
  etat: string;
} | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({ id: comptesClients.id, etat: comptesClients.etat })
    .from(comptesClients)
    .where(eq(comptesClients.betterAuthUserId, userId))
    .limit(1);
  const compte = lignes[0];
  return compte ? { id: compte.id, etat: compte.etat } : null;
}

export async function deposerPieceIdentiteClient(input: {
  compteClientId: string;
  typePiece: string;
  nomFichier: string;
  mime: string;
  octets: Uint8Array;
}): Promise<{ id: string }> {
  if (!typePieceValide(input.typePiece)) {
    throw new PieceError("TYPE_PIECE_INVALIDE", "type de pièce inconnu");
  }
  const verdict = verdictFichierPiece({
    nom: input.nomFichier,
    mime: input.mime,
    tailleOctets: input.octets.length,
  });
  if (!verdict.ok) throw new PieceError("FICHIER_REFUSE", verdict.erreur);

  const comptes = await db
    .select({ id: comptesClients.id, etat: comptesClients.etat })
    .from(comptesClients)
    .where(eq(comptesClients.id, input.compteClientId))
    .limit(1);
  const compte = comptes[0];
  if (!compte) throw new PieceError("NON_AUTORISE", "compte introuvable");
  if (!etatPieceDeposable(compte.etat)) {
    throw new PieceError(
      "COMPTE_NON_ELIGIBLE",
      "ce compte n'a plus de pièce à déposer",
    );
  }

  const id = randomUUID();
  const relatif = `pieces-clients/${compte.id}/${id}.${verdict.extension}`;
  const dossier = join(process.cwd(), "donnees", "pieces-clients", compte.id);
  try {
    await mkdir(dossier, { recursive: true });
    await writeFile(join(process.cwd(), "donnees", relatif), input.octets);
  } catch {
    throw new PieceError("STOCKAGE_INDISPONIBLE", "dépôt impossible");
  }
  await db.insert(piecesIdentiteClients).values({
    id,
    compteClientId: compte.id,
    typePiece: input.typePiece,
    mime: input.mime,
    referenceImage: relatif,
  });
  return { id };
}

export async function lirePiecesCompte(compteClientId: string) {
  return db
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
    .where(eq(piecesIdentiteClients.compteClientId, compteClientId))
    .orderBy(desc(piecesIdentiteClients.createdAt));
}

export async function retirerPiece(
  pieceId: string,
  compteId: string,
  ex: ExecuteurDb,
): Promise<number> {
  const resultat = await ex
    .update(piecesIdentiteClients)
    .set({ statutPiece: "RETIREE" })
    .where(
      and(
        eq(piecesIdentiteClients.id, pieceId),
        eq(piecesIdentiteClients.compteClientId, compteId),
        eq(piecesIdentiteClients.statutPiece, "REFUSEE"),
      ),
    );
  return lignesEcrites(resultat);
}

export async function statuerPiece(
  pieceId: string,
  adminId: string,
  statut: StatutPiece,
  refusMotif: string | null,
  ex: ExecuteurDb,
): Promise<number> {
  const resultat = await ex
    .update(piecesIdentiteClients)
    .set({ vuePar: adminId, vueLe: new Date(), statutPiece: statut, refusMotif })
    .where(
      and(
        eq(piecesIdentiteClients.id, pieceId),
        eq(piecesIdentiteClients.statutPiece, "EN_ATTENTE"),
      ),
    );
  return lignesEcrites(resultat);
}
