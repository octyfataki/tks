export function lignesEcrites(resultat: unknown): number {
  const entete = (Array.isArray(resultat) ? resultat[0] : resultat) as
    | { affectedRows?: number }
    | null
    | undefined;
  return typeof entete?.affectedRows === "number" ? entete.affectedRows : 0;
}