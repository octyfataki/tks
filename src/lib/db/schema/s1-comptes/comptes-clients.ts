import { mysqlTable, timestamp, varchar, index } from "drizzle-orm/mysql-core";

export const comptesClients = mysqlTable(
  "comptes_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    betterAuthUserId: varchar("better_auth_user_id", { length: 36 })
      .notNull()
      .unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    telephone: varchar("telephone", { length: 32 }).notNull().unique(),
    etat: varchar("etat", { length: 32 })
      .notNull()
      .default("EN_ATTENTE_VALIDATION"),
    creePar: varchar("cree_par", { length: 36 }),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    valideLe: timestamp("valide_le", { fsp: 3 }),
    refuseMotif: varchar("refuse_motif", { length: 500 }),
    profilCandidatId: varchar("profil_candidat_id", { length: 36 }),
  },
  (table) => [
    index("comptes_clients_etat_idx").on(table.etat),
    index("comptes_clients_cree_par_idx").on(table.creePar),
    index("comptes_clients_profil_candidat_idx").on(table.profilCandidatId),
  ],
);

export type CompteClient = typeof comptesClients.$inferSelect;
export type NouveauCompteClient = typeof comptesClients.$inferInsert;
