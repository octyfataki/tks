import { index, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// S1 stories 11-13 + docs/db/01-admin-comptes.md §6.
// Pièce d'identité vue par un humain pour un compte staff (reset, validation).
// Aucun chemin sensible sans piece_id : la pièce est conservée et réutilisable
// lors d'une deuxième demande. reference_image = chemin/objet stocké, jamais
// le binaire en base.
export const piecesIdentiteStaff = mysqlTable(
  "pieces_identite_staff",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteStaffId: varchar("compte_staff_id", { length: 36 }).notNull(),
    typePiece: varchar("type_piece", { length: 64 }).notNull(),
    referenceImage: text("reference_image").notNull(),
    vuePar: varchar("vue_par", { length: 36 }).notNull(),
    vueLe: timestamp("vue_le", { fsp: 3 }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("pieces_identite_staff_compte_idx").on(table.compteStaffId),
    index("pieces_identite_staff_vue_par_idx").on(table.vuePar),
  ],
);

export type PieceIdentiteStaff = typeof piecesIdentiteStaff.$inferSelect;
export type NouvellePieceIdentiteStaff =
  typeof piecesIdentiteStaff.$inferInsert;
