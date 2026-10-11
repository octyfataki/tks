// Fiche d'un compte client (issue #9) : couche de lecture pure. Un compte
// est une connexion (téléphone = clé, GLOSSARY) ; la fiche ne montre jamais
// de solde, de dette ni de plafond — le dossier financier vit en S4 et
// n'existe pas encore.
//
// Ce module ne touche ni base, ni framework : l'assemblage se fait sur un
// lecteur injecté, donc testable sans environnement. Le lecteur réel vit
// dans fiche-client-base.ts.

/** Pièce d'identité telle qu'exposée sur la fiche. */
export type PieceFicheClient = {
  id: string;
  typePiece: string;
  mime: string;
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
 * Une pièce déposée après la validation du compte : elle n'a pas encore
 * été vue par un humain au titre de la validation en cours — à revoir.
 * Sans date de validation, rien n'est « après » : faux.
 */
export function pieceDeposeeApresValidation(
  piece: Pick<PieceFicheClient, "deposeLe">,
  valideLe: Date | null,
): boolean {
  if (!valideLe) return false;
  return piece.deposeLe.getTime() > valideLe.getTime();
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
