// Règles métier staff — validation applicative (choix : tout applicatif,
// pas de CHECK en base). Source : docs/db/01-admin-comptes.md, S1 spec, GLOSSARY.

export const ROLES_STAFF = [
  "ADMIN_PRINCIPAL",
  "ADMIN_TECHNIQUE",
  "AGENT",
] as const;
export type RoleStaff = (typeof ROLES_STAFF)[number];

export const ETATS_STAFF = ["VALIDE", "SUSPENDU", "REVOQUE"] as const;
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
 * Téléphone staff : contact uniquement, optionnel, jamais identifiant, jamais
 * vérifié par SMS (S1 : aucun SMS nulle part — la confiance passe par
 * l'email). Absent = valide. Présent = format international souple : `+`
 * optionnel, chiffres, espaces, tirets et points, 7 à 15 chiffres.
 */
export function telephoneStaffValide(telephone: string): boolean {
  const valeur = telephone.trim();
  if (valeur === "") return true;
  if (!/^[+]?[\d\s.\-()]{7,24}$/.test(valeur)) return false;
  const chiffres = valeur.replace(/\D/g, "");
  return chiffres.length >= 7 && chiffres.length <= 15;
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

/**
 * Révoquer un compte d'administration : même autorisation que la
 * création — administrateur technique ou principal, toujours VALIDE.
 * La révocation est définitive (REVOQUE = inutilisable, jamais de
 * retour) : rouvrir un accès passe par révocation + recréation (S2).
 * Pour un malentendu, voir la suspension (peutSuspendreAdmin) :
 * réversible, connexion refusée, sessions tuées.
 */
export function peutRevoquerAdmin(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return peutCreerAdminPrincipal(roleCreateur, etatCreateur);
}

/**
 * Suspendre un compte staff (VALIDE → SUSPENDU) : même autorisation que
 * la révocation — administrateur technique ou principal, toujours VALIDE.
 * La suspension est réversible (lever la suspension) : le compte suspendu
 * ne se connecte plus et ses sessions sont tuées, mais le retour vers
 * VALIDE existe — contrairement à REVOQUE, définitif. Jamais sur
 * soi-même (garde côté action), jamais sur un compte REVOQUE.
 */
export function peutSuspendreAdmin(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return peutRevoquerAdmin(roleCreateur, etatCreateur);
}

/**
 * Lever la suspension d'un compte staff (SUSPENDU → VALIDE) : même
 * autorisation que suspendre — administrateur technique ou principal,
 * toujours VALIDE. Jamais sur soi-même (garde côté action) : on ne se
 * dé-suspend pas tout seul.
 */
export function peutLeverSuspension(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return peutSuspendreAdmin(roleCreateur, etatCreateur);
}

/**
 * Machine à états d'un compte staff. Transitions autorisées :
 * VALIDE → SUSPENDU, SUSPENDU → VALIDE, VALIDE → REVOQUE,
 * SUSPENDU → REVOQUE. Tout le reste est refusé — surtout REVOQUE → *,
 * définitif, et les auto-transitions (suspendre deux fois = état, pas
 * d'erreur côté action, mais pas une transition).
 */
export function transitionCompteStaffValide(
  depart: string,
  arrivee: string,
): boolean {
  if (depart === "VALIDE" && arrivee === "SUSPENDU") return true;
  if (depart === "SUSPENDU" && arrivee === "VALIDE") return true;
  if (depart === "VALIDE" && arrivee === "REVOQUE") return true;
  if (depart === "SUSPENDU" && arrivee === "REVOQUE") return true;
  return false;
}

/**
 * Corriger un compte d'administration (support / livraison : coquille sur
 * le nom, téléphone de contact). Même autorisation que la création et la
 * révocation — administrateur technique ou principal, toujours VALIDE.
 * Périmètre volontairement étroit, S2 §Frontière :
 * - nom + téléphone uniquement (contact, jamais identifiant) ;
 * - rôle immuable (peutChangerRole = false) : une erreur de rôle se
 *   corrige par révocation + recréation tracées, jamais par update ;
 * - email intouchable ici (identifiant better-auth, sync + vérification
 *   dédiées) : une coquille d'email se corrige aussi par
 *   révocation + recréation ;
 * - jamais de secret (mot de passe, second facteur) ;
 * - jamais sur un compte REVOQUE (définitif).
 * L'auto-correction de son propre nom / téléphone est autorisée (sans
 * risque de verrouillage) ; l'auto-révocation reste interdite côté action.
 */
export function peutModifierAdmin(
  roleModificateur: string,
  etatModificateur: string,
): boolean {
  return peutCreerAdminPrincipal(roleModificateur, etatModificateur);
}

/**
 * Renommer l'étiquette du second facteur (« Code par SMS »).
 * Même autorisation que la correction nom + téléphone : seul le libellé
 * est écrit, jamais le secret du second facteur (S2-04 : un administrateur
 * technique ne voit ni ne modifie aucun secret). Jamais sur un compte REVOQUE.
 */
export function peutRenommerAppareil2fa(
  roleModificateur: string,
  etatModificateur: string,
): boolean {
  return peutModifierAdmin(roleModificateur, etatModificateur);
}

/**
 * ÉCART ASSUMÉ à S1-spec (« le lien ne peut créer qu'un compte AGENT »),
 * demandé explicitement : un lien peut aussi créer un ADMIN_PRINCIPAL, pour
 * que la personne choisisse elle-même son email + mot de passe.
 * Même règle d'autorisation que la création directe (peutCreerAdminPrincipal) :
 * ADMIN_TECHNIQUE ou ADMIN_PRINCIPAL, toujours VALIDE.
 */
export function peutInviterAdminPrincipal(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return peutCreerAdminPrincipal(roleCreateur, etatCreateur);
}

/**
 * Normalise un email staff (identifiant de connexion) : minuscules,
 * sans espaces. Renvoie `null` si invalide (pas de @, trop long).
 * L'unicité se vérifie en base (contrainte UNIQUE + pré-contrôle).
 */
export function normaliserEmailStaff(email: string): string | null {
  const valeur = email.trim().toLowerCase();
  if (!valeur.includes("@")) return null;
  if (valeur.length < 3 || valeur.length > 255) return null;
  return valeur;
}

/** Une invitation cible AGENT ou ADMIN_PRINCIPAL — jamais CLIENT, jamais
 * ADMIN_TECHNIQUE (le bootstrap technique reste le seul chemin). Le rôle
 * effectif est fixé par le lien et vérifié à l'acceptation : un lien AGENT
 * ne peut pas produire un admin, et inversement.
 */
export function roleCibleInvitationValide(roleCible: string): boolean {
  return roleCible === "AGENT" || roleCible === "ADMIN_PRINCIPAL";
}

export const ETATS_LIEN_INVITATION = [
  "en-attente",
  "termine",
  "expire",
  "revoque",
] as const;
export type EtatLienInvitation = (typeof ETATS_LIEN_INVITATION)[number];

/**
 * État d'affichage d'un lien d'invitation : consommé > révoqué > expiré >
 * en attente. Un lien révoqué reste « révoqué » même après son expiration :
 * c'est la décision humaine qui fait foi, pas l'horloge.
 * Vaut pour les deux voies : lien d'invitation (invitations_agents) et
 * fiche de premier accès (premiers_acces_admin).
 */
export function etatLienInvitation(
  lien: {
    consommeLe: Date | null;
    revoqueLe: Date | null;
    expireLe: Date;
  },
  maintenant: number = Date.now(),
): EtatLienInvitation {
  if (lien.consommeLe !== null) return "termine";
  if (lien.revoqueLe !== null) return "revoque";
  if (lien.expireLe.getTime() < maintenant) return "expire";
  return "en-attente";
}

/**
 * Verdict pur d'une demande de révocation d'un lien (voie `lien` ou voie
 * `fiche`) : consommé et expiré sont non révoquables (message explicite),
 * déjà révoqué est idempotent (même état, pas d'erreur — la révocation ne
 * s'écrit qu'une fois).
 */
export type VerdictRevocationLien =
  | "A_REVOQUER"
  | "DEJA_REVOQUE"
  | "DEJA_CONSOMME"
  | "EXPIRE";

export function verdictRevocationLien(
  lien: {
    consommeLe: Date | null;
    revoqueLe: Date | null;
    expireLe: Date;
  },
  maintenant: number = Date.now(),
): VerdictRevocationLien {
  if (lien.consommeLe !== null) return "DEJA_CONSOMME";
  if (lien.revoqueLe !== null) return "DEJA_REVOQUE";
  if (lien.expireLe.getTime() < maintenant) return "EXPIRE";
  return "A_REVOQUER";
}

// ---- Réglages métier (/admin/parametres) --------
// Liste fermée : toute autre clé est refusée. Chaque réglage porte sa valeur
// par défaut (appliquée quand la ligne est absente) et ses bornes.

/** Clés de réglage existantes. */
export const CLES_REGLAGES = ["duree_invitation_jours"] as const;
export type CleReglage = (typeof CLES_REGLAGES)[number];

export function estCleReglage(cle: string): cle is CleReglage {
  return (CLES_REGLAGES as readonly string[]).includes(cle);
}

/** Durée par défaut d'un lien d'invitation, en jours. */
export const DEFAUT_DUREE_INVITATION_JOURS = 7;
export const MIN_DUREE_INVITATION_JOURS = 1;
export const MAX_DUREE_INVITATION_JOURS = 30;

/**
 * Normalise une durée d'invitation en jours : entier borné [1, 30].
 * Toute valeur illisible retombe sur le défaut — un réglage ne casse jamais
 * la création d'un lien.
 */
export function normaliserDureeInvitationJours(valeur: unknown): number {
  const nombre = typeof valeur === "string" ? Number(valeur) : Number(valeur);
  if (!Number.isFinite(nombre)) return DEFAUT_DUREE_INVITATION_JOURS;
  const entier = Math.floor(nombre);
  if (entier < MIN_DUREE_INVITATION_JOURS) return MIN_DUREE_INVITATION_JOURS;
  if (entier > MAX_DUREE_INVITATION_JOURS) return MAX_DUREE_INVITATION_JOURS;
  return entier;
}

/**
 * Nature d'un réglage : ce qui sépare le technique du métier (S2
 * §Frontière — « ni taux, ni plafond » pour l'administrateur technique).
 * - `TECHNIQUE` : mécanique interne, sans portée financière directe
 *   (ex. durée d'un lien d'invitation). Les deux administrateurs VALIDE
 *   peuvent modifier.
 * - `METIER` : décision du distributeur qui touche l'argent ou le crédit
 *   (ex. plafond par défaut, seuil de retard). Seul l'administrateur
 *   principal VALIDE peut modifier. Aucune clé METIER n'existe encore :
 *   les classer ici suffit à appliquer la règle le jour où elles arrivent.
 */
export type NatureReglage = "TECHNIQUE" | "METIER";

/** Nature de chaque clé de réglage existante. */
export const NATURE_REGLAGE: Record<CleReglage, NatureReglage> = {
  duree_invitation_jours: "TECHNIQUE",
};

/**
 * Modifier un réglage de la nature donnée : un réglage métier est réservé
 * à l'administrateur principal VALIDE ; un réglage technique suit la même
 * autorisation que créer un administrateur principal (technique ou
 * principal, toujours VALIDE).
 */
export function peutModifierReglageNature(
  nature: NatureReglage,
  roleModificateur: string,
  etatModificateur: string,
): boolean {
  if (nature === "METIER") {
    return (
      roleModificateur === "ADMIN_PRINCIPAL" && etatModificateur === "VALIDE"
    );
  }
  return peutCreerAdminPrincipal(roleModificateur, etatModificateur);
}

/**
 * Modifier le réglage de la clé donnée : la nature de la clé décide.
 * Clé inconnue = refus (liste fermée, comme les permissions S2).
 */
export function peutModifierReglage(
  cle: string,
  roleModificateur: string,
  etatModificateur: string,
): boolean {
  if (!estCleReglage(cle)) return false;
  return peutModifierReglageNature(
    NATURE_REGLAGE[cle],
    roleModificateur,
    etatModificateur,
  );
}

// ---- Complément S1 : second facteur, pièces, accès temporaires --------
// docs/db/01-admin-comptes.md §2, §5, §6. Règles purement applicatives
// (pas de CHECK en base), testées dans validation-complement.test.ts.

/** Durée max d'un accès temporaire reset staff : 24 h (courte durée). */
export const DUREE_MAX_ACCES_TEMPORAIRE_MS = 24 * 60 * 60 * 1000;

/** Durée de validité d'un lien de premier accès : 24 h. Assez pour activer
 * le lendemain, trop court pour traîner. */
export const DUREE_PREMIER_ACCES_MS = 24 * 60 * 60 * 1000;

/** Seuls les deux rôles admin portent un second facteur OTP (SMS ou email). */
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

// ---- Comptes clients (S1-01, S1-03) --------
// docs/db/02-comptes-clients.md, GLOSSARY « Compte ». Règles purement
// applicatives (pas de CHECK en base), comme le staff ci-dessus.

/** Les quatre états d'un compte client, et rien d'autre. */
export const ETATS_CLIENT = [
  "EN_ATTENTE_VALIDATION",
  "VALIDE",
  "REFUSE",
  "REVOQUE",
] as const;
export type EtatClient = (typeof ETATS_CLIENT)[number];

export function estEtatClient(etat: string): etat is EtatClient {
  return (ETATS_CLIENT as readonly string[]).includes(etat);
}

/**
 * Machine à états d'un compte client. Transitions autorisées :
 * EN_ATTENTE_VALIDATION → VALIDE | REFUSE | REVOQUE,
 * REFUSE → VALIDE | REVOQUE (le distributeur valide plus tard, sans
 * ressaisie), VALIDE → REVOQUE. Tout le reste est refusé — surtout
 * REVOQUE → *, définitif, et VALIDE → EN_ATTENTE_VALIDATION (on ne
 * rebloque jamais un compte validé).
 */
export function transitionCompteClientValide(
  depart: string,
  arrivee: string,
): boolean {
  if (depart === "EN_ATTENTE_VALIDATION") {
    return (
      arrivee === "VALIDE" || arrivee === "REFUSE" || arrivee === "REVOQUE"
    );
  }
  if (depart === "REFUSE") {
    return arrivee === "VALIDE" || arrivee === "REVOQUE";
  }
  if (depart === "VALIDE") {
    return arrivee === "REVOQUE";
  }
  return false;
}

/**
 * Normalise un téléphone de compte client en forme canonique : espaces,
 * points, tirets et parenthèses retirés, `00` initial converti en `+`.
 * Renvoie `null` si le numéro est invalide — même règle souple que le
 * staff (7 à 15 chiffres). La forme canonique est celle stockée et
 * comparée : deux écritures du même numéro (`+243 815 000 000` et
 * `+243815000000`) sont le même compte, et la seconde inscription est
 * refusée (S1-01, unicité).
 */
export function normaliserTelephoneClient(telephone: string): string | null {
  const brut = telephone.trim();
  if (brut === "") return null;
  let canonique = brut.replace(/[\s.\-()]/g, "");
  if (canonique.startsWith("00")) canonique = `+${canonique.slice(2)}`;
  if (!telephoneStaffValide(canonique)) return null;
  // Revalide la forme canonique elle-même : le stockage ne contient que
  // des chiffres avec un `+` initial optionnel, jamais de séparateurs.
  if (!/^[+]?\d+$/.test(canonique)) return null;
  return canonique;
}

/**
 * Téléphone du compte client : clé métier du compte (GLOSSARY, invariant
 * de séparation), UNIQUE en base. Même format souple que le staff, mais
 * obligatoire ici : un compte sans téléphone ne peut pas être rappelé au
 * comptoir.
 */
export function telephoneClientValide(telephone: string): boolean {
  return normaliserTelephoneClient(telephone) !== null;
}
