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

export function estAdminTechnique(role: string): boolean {
  return role === "ADMIN_TECHNIQUE";
}

export function peutModifierSesCoordonnees(role: string, etat: string): boolean {
  if (etat !== "VALIDE") return false;
  return estAdminTechnique(role) === false;
}

export function estEtatStaff(etat: string): etat is EtatStaff {
  return (ETATS_STAFF as readonly string[]).includes(etat);
}

export function peutChangerRole(): false {
  return false;
}

export function telephoneStaffValide(telephone: string): boolean {
  const valeur = telephone.trim();
  if (valeur === "") return true;
  if (!/^[+]?[\d\s.\-()]{7,24}$/.test(valeur)) return false;
  const chiffres = valeur.replace(/\D/g, "");
  return chiffres.length >= 7 && chiffres.length <= 15;
}

export function estBootstrapTechniqueValide(
  role: string,
  creePar: string | null,
  staffExistant: number,
): boolean {
  if (staffExistant > 0) return false;
  return role === "ADMIN_TECHNIQUE" && creePar === null;
}

export function peutCreerAdminPrincipal(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  if (etatCreateur !== "VALIDE") return false;
  return (
    roleCreateur === "ADMIN_TECHNIQUE" || roleCreateur === "ADMIN_PRINCIPAL"
  );
}

export function peutInviterAgent(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return roleCreateur === "ADMIN_PRINCIPAL" && etatCreateur === "VALIDE";
}

export function peutRevoquerAdmin(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return peutCreerAdminPrincipal(roleCreateur, etatCreateur);
}

export function peutSuspendreAdmin(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return peutRevoquerAdmin(roleCreateur, etatCreateur);
}

export function peutLeverSuspension(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return peutSuspendreAdmin(roleCreateur, etatCreateur);
}

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

export function peutModifierAdmin(
  roleModificateur: string,
  etatModificateur: string,
): boolean {
  return peutCreerAdminPrincipal(roleModificateur, etatModificateur);
}

export function peutRenommerAppareil2fa(
  roleModificateur: string,
  etatModificateur: string,
): boolean {
  return peutModifierAdmin(roleModificateur, etatModificateur);
}

export function peutInviterAdminPrincipal(
  roleCreateur: string,
  etatCreateur: string,
): boolean {
  return peutCreerAdminPrincipal(roleCreateur, etatCreateur);
}

export function normaliserEmailStaff(email: string): string | null {
  const valeur = email.trim().toLowerCase();
  if (!valeur.includes("@")) return null;
  if (valeur.length < 3 || valeur.length > 255) return null;
  return valeur;
}

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

export const CLES_REGLAGES = ["duree_invitation_jours"] as const;
export type CleReglage = (typeof CLES_REGLAGES)[number];

export function estCleReglage(cle: string): cle is CleReglage {
  return (CLES_REGLAGES as readonly string[]).includes(cle);
}

export const DEFAUT_DUREE_INVITATION_JOURS = 7;
export const MIN_DUREE_INVITATION_JOURS = 1;
export const MAX_DUREE_INVITATION_JOURS = 30;

export function normaliserDureeInvitationJours(valeur: unknown): number {
  const nombre = typeof valeur === "string" ? Number(valeur) : Number(valeur);
  if (!Number.isFinite(nombre)) return DEFAUT_DUREE_INVITATION_JOURS;
  const entier = Math.floor(nombre);
  if (entier < MIN_DUREE_INVITATION_JOURS) return MIN_DUREE_INVITATION_JOURS;
  if (entier > MAX_DUREE_INVITATION_JOURS) return MAX_DUREE_INVITATION_JOURS;
  return entier;
}

export type NatureReglage = "TECHNIQUE" | "METIER";

export const NATURE_REGLAGE: Record<CleReglage, NatureReglage> = {
  duree_invitation_jours: "TECHNIQUE",
};

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

export const DUREE_MAX_ACCES_TEMPORAIRE_MS = 24 * 60 * 60 * 1000;

export const DUREE_PREMIER_ACCES_MS = 24 * 60 * 60 * 1000;

export function roleExigeSecondFacteur(): boolean {
  return false;
}

export function rolePeutActiverSecondFacteur(role: string): boolean {
  return (
    role === "ADMIN_PRINCIPAL" ||
    role === "ADMIN_TECHNIQUE" ||
    role === "AGENT"
  );
}

export function compteClientPeutActiverSecondFacteur(etat: string): boolean {
  return etat === "VALIDE";
}

export function peutRemplacerFacteur2fa(
  roleDemandeur: string,
  etatDemandeur: string,
): boolean {
  return roleDemandeur === "ADMIN_PRINCIPAL" && etatDemandeur === "VALIDE";
}

export function accesTemporaireUtilisable(
  consommeLe: Date | null,
  expireLe: Date,
  maintenant: number = Date.now(),
): boolean {
  if (consommeLe !== null) return false;
  return expireLe.getTime() > maintenant;
}

export function ouvertureAccesTemporaireValide(
  pieceId: string | null,
  expireLe: Date,
  ouvertLe: number = Date.now(),
): boolean {
  if (!pieceId) return false;
  const duree = expireLe.getTime() - ouvertLe;
  return duree > 0 && duree <= DUREE_MAX_ACCES_TEMPORAIRE_MS;
}

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

export function normaliserTelephoneClient(telephone: string): string | null {
  const brut = telephone.trim();
  if (brut === "") return null;
  let canonique = brut.replace(/[\s.\-()]/g, "");
  if (canonique.startsWith("00")) canonique = `+${canonique.slice(2)}`;
  if (!telephoneStaffValide(canonique)) return null;
  if (!/^[+]?\d+$/.test(canonique)) return null;
  return canonique;
}

export function telephoneClientValide(telephone: string): boolean {
  return normaliserTelephoneClient(telephone) !== null;
}
