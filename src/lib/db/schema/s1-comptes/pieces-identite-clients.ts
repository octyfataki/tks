import { index, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const piecesIdentiteClients = mysqlTable(
  "pieces_identite_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteClientId: varchar("compte_client_id", { length: 36 }).notNull(),
    typePiece: varchar("type_piece", { length: 64 }).notNull(),
    mime: varchar("mime", { length: 64 }).notNull(),
    referenceImage: text("reference_image").notNull(),
    statutPiece: varchar("statut_piece", { length: 32 })
      .notNull()
      .default("EN_ATTENTE"),
    refusMotif: text("refus_motif"),
    vuePar: varchar("vue_par", { length: 36 }),
    vueLe: timestamp("vue_le", { fsp: 3 }),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("pieces_identite_clients_compte_idx").on(table.compteClientId),
  ],
);

export type PieceIdentiteClient = typeof piecesIdentiteClients.$inferSelect;
export type NouvellePieceIdentiteClient =
  typeof piecesIdentiteClients.$inferInsert;
