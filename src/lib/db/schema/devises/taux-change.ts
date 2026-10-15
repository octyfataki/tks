import { index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

// S3 — taux du jour. Une ligne par jour : l'unicité porte sur `jour`, ce qui
// garantit en base « un jour, au plus un taux » (invariant S3). Valeur = francs
// pour 1 USD, entier strictement positif. Aucune récupération automatique :
// c'est un taux négocié, saisi manuellement (GLOSSARY « Taux de change »).
// `saisi_par` désigne le compte staff auteur ; la saisie est journalisée comme
// écriture métier (S3, invariant 8). Aucun taux n'est stocké sur une créance ou
// un paiement — cette table est un paramètre de lecture, résolu au calcul
// (ADR-0001).
export const tauxChange = mysqlTable(
  "taux_change",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    // Jour civil de Kinshasa, format AAAA-MM-JJ.
    jour: varchar("jour", { length: 10 }).notNull().unique(),
    // Francs pour 1 USD. Entier strictement positif (validé applicativement).
    valeur: int("valeur", { unsigned: true }).notNull(),
    saisiPar: varchar("saisi_par", { length: 36 }).notNull(),
    // Horloge de l'appareil auteur, conservée telle quelle (offline-first, S3).
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("taux_change_saisi_par_idx").on(table.saisiPar)],
);

export type TauxChange = typeof tauxChange.$inferSelect;
export type NouveauTauxChange = typeof tauxChange.$inferInsert;
