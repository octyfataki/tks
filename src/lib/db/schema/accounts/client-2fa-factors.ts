import {
  boolean,
  index,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const facteurs2faClients = mysqlTable(
  "facteurs_2fa_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteClientId: varchar("compte_client_id", { length: 36 })
      .notNull()
      .unique(),
    nomAppareil: varchar("nom_appareil", { length: 255 }).notNull(),
    actif: boolean("actif").default(true).notNull(),
    creePar: varchar("cree_par", { length: 36 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    remplaceLe: timestamp("remplace_le", { fsp: 3 }),
  },
  (table) => [
    index("facteurs_2fa_clients_compte_idx").on(table.compteClientId),
    index("facteurs_2fa_clients_cree_par_idx").on(table.creePar),
  ],
);

export type Facteur2faClient = typeof facteurs2faClients.$inferSelect;
export type NouveauFacteur2faClient = typeof facteurs2faClients.$inferInsert;
