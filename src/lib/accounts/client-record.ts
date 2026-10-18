export const STATUTS_PIECE = ["EN_ATTENTE", "ACCEPTEE", "REFUSEE", "RETIREE"] as const;
export type StatutPiece = (typeof STATUTS_PIECE)[number];

export function statutPieceValide(valeur: string): valeur is StatutPiece {
  return (STATUTS_PIECE as readonly string[]).includes(valeur);
}

export type PieceFicheClient = {
  id: string;
  typePiece: string;
  mime: string;
  statutPiece: StatutPiece;
  refusMotif: string | null;
  vuePar: string | null;
  vueLe: Date | null;
  deposeLe: Date;
};

export type IdentiteClient = {
  id: string;
  nom: string | null;
  email: string;
  telephone: string;
  etat: string;
  inscritLe: Date;
  valideLe: Date | null;
  refuseMotif: string | null;
};

export type FicheClient = IdentiteClient & {
  pieces: PieceFicheClient[];
};

export type LecteurFicheClient = {
  lireIdentite(compteId: string): Promise<IdentiteClient | null>;
  lirePieces(compteId: string): Promise<PieceFicheClient[]>;
};

export async function lireFicheClient(
  lecteur: LecteurFicheClient,
  compteId: string,
): Promise<FicheClient | null> {
  const identite = await lecteur.lireIdentite(compteId);
  if (!identite) return null;
  const pieces = await lecteur.lirePieces(compteId);
  return { ...identite, pieces };
}

export function peutOuvrirFicheClient(
  role: string,
  etat: string,
  permissionValider: boolean,
): boolean {
  if (etat !== "VALIDE") return false;
  if (role === "ADMIN_PRINCIPAL" || role === "ADMIN_TECHNIQUE") return true;
  if (role === "AGENT") return permissionValider;
  return false;
}

export function pieceAValider(
  fiche: Pick<FicheClient, "pieces">,
): PieceFicheClient | null {
  return fiche.pieces[0] ?? null;
}

export function pieceARevoir(piece: Pick<PieceFicheClient, "statutPiece">): boolean {
  return !["ACCEPTEE", "REFUSEE", "RETIREE"].includes(piece.statutPiece);
}

export function pieceRetirable(
  piece: Pick<PieceFicheClient, "statutPiece">,
): boolean {
  return piece.statutPiece === "REFUSEE";
}

export function revuePiecePossible(fiche: Pick<FicheClient, "etat"> & {
  pieces: Pick<PieceFicheClient, "statutPiece">[];
}): boolean {
  return fiche.etat === "VALIDE" && fiche.pieces.some(pieceARevoir);
}

export function etatTranchable(etat: string): boolean {
  return etat === "EN_ATTENTE_VALIDATION" || etat === "REFUSE";
}

export function etatRevoquable(etat: string): boolean {
  return etat !== "REVOQUE";
}
