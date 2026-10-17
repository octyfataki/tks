import { index, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const demandesAccesProfil = mysqlTable(
  "demandes_acces_profil",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteClientId: varchar("compte_client_id", { length: 36 }).notNull(),
    profilClientId: varchar("profil_client_id", { length: 36 }).notNull(),
    statut: varchar("statut", { length: 16 })
      .notNull()
      .default("EN_ATTENTE"),
    motif: varchar("motif", { length: 500 }),
    decidePar: varchar("decide_par", { length: 36 }),
    decideLe: timestamp("decide_le", { fsp: 3 }),
    indiceDetection: varchar("indice_detection", { length: 128 }),
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("demandes_acces_profil_compte_idx").on(table.compteClientId),
    index("demandes_acces_profil_profil_idx").on(table.profilClientId),
    index("demandes_acces_profil_statut_idx").on(table.statut),
  ],
);

export const STATUTS_DEMANDE_ACCES = ["EN_ATTENTE", "ACCORDEE", "REFUSEE"] as const;
export type StatutDemandeAcces = (typeof STATUTS_DEMANDE_ACCES)[number];

export function estStatutDemandeAcces(statut: string): statut is StatutDemandeAcces {
  return (STATUTS_DEMANDE_ACCES as readonly string[]).includes(statut);
}

export type DemandeAccesProfil = typeof demandesAccesProfil.$inferSelect;
export type NouvelleDemandeAccesProfil = typeof demandesAccesProfil.$inferInsert;