import {
  boolean,
  index,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// S1 issue #3 (second facteur optionnel pour tous) + docs/db/02-comptes-clients.md.
// Traçabilité métier du second facteur client, miroir de
// `facteurs_2fa_admin` : le code OTP lui-même reste dans la table
// `two_factor` de better-auth (chiffrée) — ici on ne garde que :
// quel compte client, quelle méthode nommée (« Code par SMS »,
// « Code par email »), actif ou remplacé, par qui (le titulaire lui-même).
// Un seul facteur actif par compte client (compteClientId UNIQUE).
// Pas de FK base : identités répliquées offline-first (ADR-0006), lien vérifié
// côté applicatif. Seul un compte `VALIDE` s'enrôle (garde applicative).
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
