const relatif = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

export function joursAttente(inscritLe: Date, maintenant: number): number {
  return Math.max(
    0,
    Math.floor((maintenant - inscritLe.getTime()) / (24 * 60 * 60 * 1000)),
  );
}

export function texteAttente(inscritLe: Date, maintenant: number): string {
  return relatif.format(-joursAttente(inscritLe, maintenant), "day");
}

export function detailAttente(inscritLe: Date, maintenant: number): string {
  const jours = joursAttente(inscritLe, maintenant);
  if (jours === 0) return "arrivé aujourd'hui";
  if (jours === 1) return "arrivé hier";
  return `en attente depuis ${jours} jours`;
}
