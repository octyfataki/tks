import {
  boolean,
  index,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// S1 stories 2-4 + docs/db/01-admin-comptes.md §2.
// Traçabilité métier du second facteur admin. Le code OTP lui-même reste
// dans la table `two_factor` de better-auth (chiffrée) — ici on ne garde que :
// quel compte, quel appareil nommé, actif ou remplacé, par qui.
// Un seul facteur actif par admin (compteStaffId UNIQUE).
// Pas de FK base : identités répliquées offline-first (ADR-0006), lien vérifié
// côté applicatif.
export const facteurs2faAdmin = mysqlTable(
  "facteurs_2fa_admin",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteStaffId: varchar("compte_staff_id", { length: 36 })
      .notNull()
      .unique(),
    nomAppareil: varchar("nom_appareil", { length: 255 }).notNull(),
    actif: boolean("actif").default(true).notNull(),
    creePar: varchar("cree_par", { length: 36 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    remplaceLe: timestamp("remplace_le", { fsp: 3 }),
  },
  (table) => [
    index("facteurs_2fa_admin_compte_idx").on(table.compteStaffId),
    index("facteurs_2fa_admin_cree_par_idx").on(table.creePar),
  ],
);

export type Facteur2faAdmin = typeof facteurs2faAdmin.$inferSelect;
export type NouveauFacteur2faAdmin = typeof facteurs2faAdmin.$inferInsert;
