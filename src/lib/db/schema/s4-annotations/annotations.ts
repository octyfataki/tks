import { index, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const annotationsClients = mysqlTable(
  "annotations_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteClientId: varchar("compte_client_id", { length: 36 }).notNull(),
    profilClientId: varchar("profil_client_id", { length: 36 }),
    etiquette: varchar("etiquette", { length: 64 }).notNull(),
    statut: varchar("statut", { length: 16 }).notNull(),
    acteurId: varchar("acteur_id", { length: 36 }).notNull(),
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("annotations_clients_profil_idx").on(table.profilClientId),
    index("annotations_clients_compte_idx").on(table.compteClientId),
    index("annotations_clients_compte_etiquette_idx").on(
      table.compteClientId,
      table.etiquette,
    ),
  ],
);

export const STATUTS_ANNOTATION = ["POSEE", "RETIREE"] as const;
export type StatutAnnotation = (typeof STATUTS_ANNOTATION)[number];

export function estStatutAnnotation(statut: string): statut is StatutAnnotation {
  return (STATUTS_ANNOTATION as readonly string[]).includes(statut);
}

export type AnnotationClient = typeof annotationsClients.$inferSelect;
export type NouvelleAnnotationClient = typeof annotationsClients.$inferInsert;
