// Fiche d'un compte client (issue #9) : couche de lecture pure. Un compte
// est une connexion (téléphone = clé, GLOSSARY) ; la fiche ne montre jamais
// de solde, de dette ni de plafond — le dossier financier vit en S4 et
// n'existe pas encore.
//
// Ce module ne touche ni base, ni framework : l'assemblage se fait sur un
// lecteur injecté, donc testable sans environnement. Le lecteur réel vit
// dans fiche-client-base.ts.

/** Verdict porté par une pièce d'identité : ces quatre valeurs, rien d'autre. */
export const STATUTS_PIECE = ["EN_ATTENTE", "ACCEPTEE", "REFUSEE", "RETIREE"] as const;
export type StatutPiece = (typeof STATUTS_PIECE)[number];

export function statutPieceValide(valeur: string): valeur is StatutPiece {
  return (STATUTS_PIECE as readonly string[]).includes(valeur);
}

/** Pièce d'identité telle qu'exposée sur la fiche. */
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

/** L'identité d'un compte, sans ses pièces (lecture en deux temps). */
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

/** Fiche complète : identité du compte + pièces déposées, récentes d'abord. */
export type FicheClient = IdentiteClient & {
  pieces: PieceFicheClient[];
};

/**
 * Deux lectures injectables : l'identité du compte, puis ses pièces. C'est
 * ce qui rend l'assemblage testable sans base (fiche trouvée / id inconnu).
 */
export type LecteurFicheClient = {
  lireIdentite(compteId: string): Promise<IdentiteClient | null>;
  lirePieces(compteId: string): Promise<PieceFicheClient[]>;
};

/**
 * Assemble la fiche d'un compte : identité + pièces. Un identifiant
 * inconnu renvoie `null` — l'appelant décide du 404, jamais une fuite de
 * données d'un autre client. Les pièces ne sont lues que si le compte
 * existe.
 */
export async function lireFicheClient(
  lecteur: LecteurFicheClient,
  compteId: string,
): Promise<FicheClient | null> {
  const identite = await lecteur.lireIdentite(compteId);
  if (!identite) return null;
  const pieces = await lecteur.lirePieces(compteId);
  return { ...identite, pieces };
}

/**
 * Qui peut ouvrir la fiche d'un compte client : un administrateur principal
 * ou technique VALIDE, ou un agent VALIDE muni de la permission
 * `client.valider`. Jamais un client, jamais un compte staff
 * suspendu/révoqué, jamais un agent sans la permission.
 */
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

/**
 * La pièce à désigner pour valider : la plus récente déposée, ou `null`
 * si aucune pièce — auquel cas valider sur pièce est impossible (la vue
 * au comptoir reste, elle, ouverte).
 */
export function pieceAValider(
  fiche: Pick<FicheClient, "pieces">,
): PieceFicheClient | null {
  return fiche.pieces[0] ?? null;
}

/**
 * Une pièce attend-elle encore un verdict humain ? Seuls `ACCEPTEE`,
 * `REFUSEE` et `RETIREE` sont tranchées. Un statut inconnu compte comme à
 * revoir : mieux vaut le montrer que le cacher.
 */
export function pieceARevoir(piece: Pick<PieceFicheClient, "statutPiece">): boolean {
  return !["ACCEPTEE", "REFUSEE", "RETIREE"].includes(piece.statutPiece);
}

/**
 * Le client peut-il retirer cette pièce (ticket 11) ? Une pièce en attente
 * est hors de sa portée : on ne retire pas ce qu'un humain est en train de
 * juger. Seule une pièce refusée, que le client a déjà fait trancher et
 * qu'il remplace, se retire.
 */
export function pieceRetirable(
  piece: Pick<PieceFicheClient, "statutPiece">,
): boolean {
  return piece.statutPiece === "REFUSEE";
}

/**
 * Le geste de revue n'a de sens que sur une pièce qu'un humain peut
 * encore juger : pièce à revoir, compte déjà VALIDE. Un compte en attente
 * ou refusé passe par sa propre validation (ticket 03) — lui proposer
 * deux boutons concurrents serait un cul-de-sac de plus.
 */
export function revuePiecePossible(fiche: Pick<FicheClient, "etat"> & {
  pieces: Pick<PieceFicheClient, "statutPiece">[];
}): boolean {
  return fiche.etat === "VALIDE" && fiche.pieces.some(pieceARevoir);
}

/** Une action de décision a-t-elle un sens sur ce compte, dans cet état ? */
export function etatTranchable(etat: string): boolean {
  return etat === "EN_ATTENTE_VALIDATION" || etat === "REFUSE";
}

/**
 * Le compte peut encore être révoqué : tout sauf REVOQUE (définitif).
 * VALIDE → REVOQUE reste la sortie d'un compte devenu suspect.
 */
export function etatRevoquable(etat: string): boolean {
  return etat !== "REVOQUE";
}
