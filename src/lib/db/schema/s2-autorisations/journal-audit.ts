import {
  index,
  json,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const journalAudit = mysqlTable(
  "journal_audit",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    acteurId: varchar("acteur_id", { length: 36 }),
    roleAuMoment: varchar("role_au_moment", { length: 32 }).notNull(),
    typeAction: varchar("type_action", { length: 128 }).notNull(),
    entite: varchar("entite", { length: 128 }).notNull(),
    entiteId: varchar("entite_id", { length: 36 }),
    avant: json("avant").$type<unknown>(),
    apres: json("apres").$type<unknown>(),
    appareilId: varchar("appareil_id", { length: 128 }),
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
    statut: varchar("statut", { length: 16 }).notNull().default("REUSSIE"),
    motif: varchar("motif", { length: 255 }),
    contesteId: varchar("conteste_id", { length: 36 }),
  },
  (table) => [
    index("journal_audit_acteur_idx").on(table.acteurId),
    index("journal_audit_entite_idx").on(table.entite, table.entiteId),
    index("journal_audit_type_idx").on(table.typeAction),
    index("journal_audit_recu_idx").on(table.recuLe),
    index("journal_audit_conteste_idx").on(table.contesteId),
  ],
);

export type EvenementAudit = typeof journalAudit.$inferSelect;
export type NouvelEvenementAudit = typeof journalAudit.$inferInsert;
