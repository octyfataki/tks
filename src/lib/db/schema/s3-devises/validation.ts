export const FUSEAU_KINSHASA = "Africa/Kinshasa";
export const VALEUR_TAUX_MAX = 4_294_967_295;

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

export function valeurTauxValide(valeur: unknown): valeur is number {
  return (
    typeof valeur === "number" &&
    Number.isInteger(valeur) &&
    valeur > 0 &&
    valeur <= VALEUR_TAUX_MAX
  );
}

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