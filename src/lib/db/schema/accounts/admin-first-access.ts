import { mysqlTable, timestamp, varchar, index } from "drizzle-orm/mysql-core";

export const premiersAccesAdmin = mysqlTable(
  "premiers_acces_admin",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteStaffCible: varchar("compte_staff_cible", { length: 36 }).notNull(),
    jeton: varchar("jeton", { length: 255 }).notNull().unique(),
    expireLe: timestamp("expire_le", { fsp: 3 }).notNull(),
    consommeLe: timestamp("consomme_le", { fsp: 3 }),
    revoqueLe: timestamp("revoque_le", { fsp: 3 }),
    creePar: varchar("cree_par", { length: 36 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("premiers_acces_admin_cible_idx").on(table.compteStaffCible)],
);

export type PremierAccesAdmin = typeof premiersAccesAdmin.$inferSelect;
export type NouveauPremierAccesAdmin = typeof premiersAccesAdmin.$inferInsert;
