import { mysqlTable, timestamp, varchar, index } from "drizzle-orm/mysql-core";

// S1 + docs/db/01-admin-comptes.md — tableau réservé staff.
// Tous les comptes se connectent en email + mot de passe ; clients : voir
// 02-comptes-clients.md, jamais ici.
// Règles applicatives (tout applicatif, voir validation.ts) :
// - role immuable après création (changement = révocation + recréation, S2).
// - etat VALIDE | REVOQUE uniquement — staff jamais EN_ATTENTE_VALIDATION.
// - creePar NULL uniquement pour le premier ADMIN_TECHNIQUE (bootstrap développeur).
export const comptesStaff = mysqlTable(
  "comptes_staff",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    betterAuthUserId: varchar("better_auth_user_id", { length: 36 })
      .notNull()
      .unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    // VARCHAR (pas TEXT) : MySQL ne peut pas indexer une colonne TEXT sans
    // longueur de préfixe, et (role, etat) est indexé. Valeurs fermées
    // vérifiées côté applicatif (validation.ts).
    role: varchar("role", { length: 32 }).notNull(),
    etat: varchar("etat", { length: 32 }).notNull().default("VALIDE"),
    creePar: varchar("cree_par", { length: 36 }),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { fsp: 3 }),
  },
  (table) => [
    index("comptes_staff_role_etat_idx").on(table.role, table.etat),
    index("comptes_staff_cree_par_idx").on(table.creePar),
  ],
);

export type CompteStaff = typeof comptesStaff.$inferSelect;
export type NouveauCompteStaff = typeof comptesStaff.$inferInsert;
