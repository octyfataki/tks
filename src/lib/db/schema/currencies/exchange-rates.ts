import {
  bigint,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const tauxChange = mysqlTable(
  "taux_change",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    numero: bigint("numero", { mode: "number", unsigned: true }).notNull().unique(),
    jour: varchar("jour", { length: 10 }).notNull(),
    valeur: int("valeur", { unsigned: true }).notNull(),
    saisiPar: varchar("saisi_par", { length: 36 }).notNull(),
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("taux_change_saisi_par_idx").on(table.saisiPar),
    index("taux_change_journal_idx").on(table.jour),
  ],
);

export const tauxChangeNumeroUk = uniqueIndex(
  "taux_change_numero_unique",
).on(tauxChange.numero);

export type TauxChange = typeof tauxChange.$inferSelect;
export type NouveauTauxChange = typeof tauxChange.$inferInsert;
