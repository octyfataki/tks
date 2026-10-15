import {
  index,
  json,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// S2 issue 01 — journal d'audit append-only.
// L'immuabilité est garantie par la base (triggers BEFORE UPDATE / BEFORE
// DELETE qui rejettent, voir migration), pas par l'application.
// - `id` : généré sur l'appareil (UUID), jamais attribué par la base —
//   l'UUID d'invitation existant joue déjà ce rôle d'op_id côté S1.
// - `horodatageLocal` : heure de l'appareil, conservée telle quelle.
// - `recuLe` : heure de réception serveur. Les deux restent visibles.
// - `contesteId` (S2 issue 15) : identifiant de la ligne que la présente
//   ligne corrige — le fil « erreur → correction », remontable sans deviner.
//   NULLABLE (une action normale ne conteste rien), sans FK : une contrainte
//   casserait l'insertion hors-ligne (S8 traverse tout). L'existence de la
//   ligne contestée est contrôlée par l'application, à l'écriture.
// - La consultation du journal n'est pas journalisée (sinon boucle).
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
