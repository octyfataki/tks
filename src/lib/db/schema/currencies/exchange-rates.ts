import { index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const tauxChange = mysqlTable(
  "taux_change",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jour: varchar("jour", { length: 10 }).notNull().unique(),
    valeur: int("valeur", { unsigned: true }).notNull(),
    saisiPar: varchar("saisi_par", { length: 36 }).notNull(),
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("taux_change_saisi_par_idx").on(table.saisiPar)],
);

export type TauxChange = typeof tauxChange.$inferSelect;
export type NouveauTauxChange = typeof tauxChange.$inferInsert;
