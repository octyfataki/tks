import { index, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// S1-03 + docs/db/02-comptes-clients.md — pièces d'identité des clients.
// Le client dépose depuis l'application (image compressée ou PDF) ; un
// humain voit la pièce puis tranche. Aucun chemin ne produit VALIDE sans
// pièce : la validation porte l'identifiant de la pièce vue (piece_id),
// jamais une référence tapée à la main.
// reference_image = chemin relatif sous donnees/pieces-clients, jamais le
// binaire en base. vue_par / vue_le sont posés par la validation, pas par
// le dépôt : une pièce déposée n'est pas une pièce vue.
export const piecesIdentiteClients = mysqlTable(
  "pieces_identite_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteClientId: varchar("compte_client_id", { length: 36 }).notNull(),
    typePiece: varchar("type_piece", { length: 64 }).notNull(),
    mime: varchar("mime", { length: 64 }).notNull(),
    referenceImage: text("reference_image").notNull(),
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
