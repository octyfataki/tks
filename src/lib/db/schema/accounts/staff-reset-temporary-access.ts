import {
  boolean,
  index,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const accesTemporairesResetStaff = mysqlTable(
  "acces_temporaires_reset_staff",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteStaffCible: varchar("compte_staff_cible", { length: 36 }).notNull(),
    ouvertPar: varchar("ouvert_par", { length: 36 }).notNull(),
    pieceId: varchar("piece_id", { length: 36 }).notNull(),
    expireLe: timestamp("expire_le", { fsp: 3 }).notNull(),
    consommeLe: timestamp("consomme_le", { fsp: 3 }),
    avertissementAffiche: boolean("avertissement_affiche")
      .default(true)
      .notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("acces_tmp_staff_cible_idx").on(table.compteStaffCible),
    index("acces_tmp_staff_ouvert_par_idx").on(table.ouvertPar),
    index("acces_tmp_staff_piece_idx").on(table.pieceId),
  ],
);

export type AccesTemporaireResetStaff =
  typeof accesTemporairesResetStaff.$inferSelect;
export type NouvelAccesTemporaireResetStaff =
  typeof accesTemporairesResetStaff.$inferInsert;
