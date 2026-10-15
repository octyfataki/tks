import { index, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

// Issue #7 — annotations d'un client par étiquettes fermées, journal
// append-only.
//
// Modèle : chaque geste (poser / retirer) est une LIGNE. Rien ne se met à
// jour, rien ne se supprime (invariant 10 du glossaire : on annule par une
// écriture inverse tracée). L'état courant d'une paire (compte, étiquette)
// est l'événement le plus récent ; le badge se dérive, il n'est jamais
// stocké.
//
// Réplicable (invariant 9, offline-first) : `id` est généré sur l'appareil,
// `horodatageLocal` est l'heure de l'appareil conservée telle quelle,
// `recuLe` l'heure de réception serveur. Les deux restent visibles, comme le
// journal d'audit S2.
export const annotationsClients = mysqlTable(
  "annotations_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteClientId: varchar("compte_client_id", { length: 36 }).notNull(),
    // Code d'une entrée de ETIQUETTES_FERMEES ; validé côté applicatif.
    etiquette: varchar("etiquette", { length: 64 }).notNull(),
    // POSEE | RETIREE — validé côté applicatif (voir statuts ci-dessous).
    statut: varchar("statut", { length: 16 }).notNull(),
    // Toujours renseigné : toute action est attribuée (invariant 8).
    acteurId: varchar("acteur_id", { length: 36 }).notNull(),
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("annotations_clients_compte_idx").on(table.compteClientId),
    index("annotations_clients_compte_etiquette_idx").on(
      table.compteClientId,
      table.etiquette,
    ),
  ],
);

export const STATUTS_ANNOTATION = ["POSEE", "RETIREE"] as const;
export type StatutAnnotation = (typeof STATUTS_ANNOTATION)[number];

/** Un statut inconnu vaut refus, jamais un état implicite. */
export function estStatutAnnotation(statut: string): statut is StatutAnnotation {
  return (STATUTS_ANNOTATION as readonly string[]).includes(statut);
}

export type AnnotationClient = typeof annotationsClients.$inferSelect;
export type NouvelleAnnotationClient = typeof annotationsClients.$inferInsert;
