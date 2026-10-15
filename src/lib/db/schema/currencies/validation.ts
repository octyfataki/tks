// S3 — règles pures du taux de change, sans base ni réseau (testables
// isolément, comme comptes/validation). Le reste — lecture, écriture,
// autorisation par permission — vit dans src/lib/devises/taux.ts.

export const FUSEAU_KINSHASA = "Africa/Kinshasa";
/** Borne haute de la colonne `valeur` (INT UNSIGNED MySQL). */
export const VALEUR_TAUX_MAX = 4_294_967_295;

/**
 * Jour civil courant à Kinshasa, en AAAA-MM-JJ. Le foyer fait foi : un taux
 * saisi à 23 h heure de Kinshasa appartient à la journée qui se termine là,
 * pas à celle du serveur (UTC).
 */
export function dateDuJourKinshasa(maintenant: Date = new Date()): string {
  const parties = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSEAU_KINSHASA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(maintenant);
  const lire = (type: Intl.DateTimeFormatPartTypes): string =>
    parties.find((partie) => partie.type === type)?.value ?? "";
  return `${lire("year")}-${lire("month")}-${lire("day")}`;
}

/** Un jour valide : AAAA-MM-JJ et une date calendaire réelle. */
export function jourValide(jour: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) return false;
  const [annee, mois, quantieme] = jour.split("-").map(Number);
  if (mois < 1 || mois > 12) return false;
  if (quantieme < 1 || quantieme > 31) return false;
  const date = new Date(Date.UTC(annee, mois - 1, quantieme));
  return (
    date.getUTCFullYear() === annee &&
    date.getUTCMonth() === mois - 1 &&
    date.getUTCDate() === quantieme
  );
}

/** Une valeur de taux : entier strictement positif, tenant dans INT UNSIGNED. */
export function valeurTauxValide(valeur: unknown): valeur is number {
  return (
    typeof valeur === "number" &&
    Number.isInteger(valeur) &&
    valeur > 0 &&
    valeur <= VALEUR_TAUX_MAX
  );
}

/**
 * Décision pure d'autorisation selon le seul couple (rôle, état).
 * Renvoie `null` quand la décision dépend d'une permission individuelle
 * (agent) — la couche applicative tranche alors par `aPermission`.
 */
export function rolePeutSaisirTaux(
  role: string,
  etat: string,
): boolean | null {
  if (etat !== "VALIDE") return false;
  if (role === "ADMIN_PRINCIPAL") return true;
  if (role === "ADMIN_TECHNIQUE") return false;
  if (role === "AGENT") return null;
  return false;
}