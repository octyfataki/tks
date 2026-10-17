import { sql } from "drizzle-orm";
import {
  index,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const accesProfilClients = mysqlTable(
  "acces_profil_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteClientId: varchar("compte_client_id", { length: 36 }).notNull(),
    profilClientId: varchar("profil_client_id", { length: 36 }).notNull(),
    statut: varchar("statut", { length: 16 }).notNull().default("ACCORDE"),
    motif: varchar("motif", { length: 500 }),
    decidePar: varchar("decide_par", { length: 36 }).notNull(),
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
    compteActif: varchar("compte_actif", { length: 36 }).generatedAlwaysAs(
      sql`(if(\`statut\` = 'ACCORDE', \`compte_client_id\`, null))`,
      { mode: "virtual" },
    ),
    profilActif: varchar("profil_actif", { length: 36 }).generatedAlwaysAs(
      sql`(if(\`statut\` = 'ACCORDE', \`profil_client_id\`, null))`,
      { mode: "virtual" },
    ),
  },
  (table) => [
    uniqueIndex("acces_profil_clients_compte_actif_uq").on(table.compteActif),
    uniqueIndex("acces_profil_clients_profil_actif_uq").on(table.profilActif),
    index("acces_profil_clients_compte_idx").on(table.compteClientId),
    index("acces_profil_clients_profil_idx").on(table.profilClientId),
    index("acces_profil_clients_statut_idx").on(table.statut),
  ],
);

export const STATUTS_ACCES_PROFIL = ["ACCORDE", "REVOKE"] as const;
export type StatutAccesProfil = (typeof STATUTS_ACCES_PROFIL)[number];

export function estStatutAccesProfil(statut: string): statut is StatutAccesProfil {
  return (STATUTS_ACCES_PROFIL as readonly string[]).includes(statut);
}

export type AccesProfilClient = typeof accesProfilClients.$inferSelect;
export type NouvelAccesProfilClient = typeof accesProfilClients.$inferInsert;