// Lecture du résultat d'un UPDATE mysql2, sans base ni framework — donc
// testable partout.
//
// Piège connu du pilote : `db.update(...)` ne renvoie pas l'en-tête SQL,
// mais le tableau `[ResultSetHeader, FieldPacket[]]` que mysql2 produit.
// Lire `affectedRows` à la racine donne `undefined`, donc « aucune ligne
// écrite » — et une écriture réussie se fait prendre pour un échec.

/**
 * Nombre de lignes réellement écrites par un UPDATE. Renvoie 0 si la
 * forme reçue n'est pas reconnue : mieux vaut une garde qui bloque qu'une
 * écriture qui se croit passée.
 */
export function lignesEcrites(resultat: unknown): number {
  const entete = (Array.isArray(resultat) ? resultat[0] : resultat) as
    | { affectedRows?: number }
    | null
    | undefined;
  return typeof entete?.affectedRows === "number" ? entete.affectedRows : 0;
}