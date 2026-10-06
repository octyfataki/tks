// Règles métier staff — validation applicative (choix : tout applicatif,
// pas de CHECK en base). Source : docs/db/01-admin-comptes.md, S1 spec, GLOSSARY.

export const ROLES_STAFF = [
  "ADMIN_PRINCIPAL",
  "ADMIN_TECHNIQUE",
  "AGENT",
] as const;
export type RoleStaff = (typeof ROLES_STAFF)[number];

export const ETATS_STAFF = ["VALIDE", "REVOQUE"] as const;
export type EtatStaff = (typeof ETATS_STAFF)[number];

export function estRoleStaff(role: string): role is RoleStaff {
  return (ROLES_STAFF as readonly string[]).includes(role);
}

export function estEtatStaff(etat: string): etat is EtatStaff {
  return (ETATS_STAFF as readonly string[]).includes(etat);
}

/** Le rôle est immuable : tout changement passe par révocation + recréation (S2). */
export function peutChangerRole(): false {
  return false;
}

/**
 * Bootstrap : le tout premier compte est l'ADMIN_TECHNIQUE du développeur,
 * sans créateur (creePar NULL). Aucun autre compte ne peut naître sans créateur.
 */
export function estBootstrapTechniqueValide(
  role: string,
  creePar: string | null,
  staffExistant: number,
): boolean {
  if (staffExistant > 0) return false;
  return role === "ADMIN_TECHNIQUE" && creePar === null;
}

/**
 * Un ADMIN_PRINCIPAL est créé par l'ADMIN_TECHNIQUE (bootstrap : le développeur
 * crée le compte du distributeur) ou par un autre ADMIN_PRINCIPAL, toujours
 * VALIDE. Jamais par un agent, jamais par un compte révoqué.
 */
export function peutCreerAdminPrincipal(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  if (etatCreateur !== "VALIDE") return false;
  return (
    roleCreateur === "ADMIN_TECHNIQUE" || roleCreateur === "ADMIN_PRINCIPAL"
  );
}

/** Seul un ADMIN_PRINCIPAL VALIDE invite un agent (S1 story 5 : le distributeur). */
export function peutInviterAgent(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return roleCreateur === "ADMIN_PRINCIPAL" && etatCreateur === "VALIDE";
}

/** Une invitation ne peut cibler que le rôle AGENT. */
export function roleCibleInvitationValide(roleCible: string): boolean {
  return roleCible === "AGENT";
}

// ---- Complément S1 : second facteur, pièces, accès temporaires --------
// docs/db/01-admin-comptes.md §2, §5, §6. Règles purement applicatives
// (pas de CHECK en base), testées dans validation-complement.test.ts.

/** Durée max d'un accès temporaire reset staff : 24 h (courte durée). */
export const DUREE_MAX_ACCES_TEMPORAIRE_MS = 24 * 60 * 60 * 1000;

/** Seuls les deux rôles admin portent un second facteur TOTP. */
export function roleExigeSecondFacteur(role: string): boolean {
  return role === "ADMIN_PRINCIPAL" || role === "ADMIN_TECHNIQUE";
}

/**
 * Remplacement du facteur perdu : de bout en bout, sans bypass.
 * L'ancien est marqué remplacé (remplaceLe), le nouveau naît actif.
 * Seul un ADMIN_PRINCIPAL VALIDE (ou le titulaire lui-même assisté) initie.
 */
export function peutRemplacerFacteur2fa(
  roleDemandeur: string,
  etatDemandeur: string,
): boolean {
  return roleDemandeur === "ADMIN_PRINCIPAL" && etatDemandeur === "VALIDE";
}

/** Un accès temporaire est utilisable : non consommé et non expiré. */
export function accesTemporaireUtilisable(
  consommeLe: Date | null,
  expireLe: Date,
  maintenant: number = Date.now(),
): boolean {
  if (consommeLe !== null) return false;
  return expireLe.getTime() > maintenant;
}

/** L'ouverture exige une pièce d'identité vue et une durée courte. */
export function ouvertureAccesTemporaireValide(
  pieceId: string | null,
  expireLe: Date,
  ouvertLe: number = Date.now(),
): boolean {
  if (!pieceId) return false;
  const duree = expireLe.getTime() - ouvertLe;
  return duree > 0 && duree <= DUREE_MAX_ACCES_TEMPORAIRE_MS;
}
