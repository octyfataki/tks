import { mysqlTable, timestamp, varchar, index } from "drizzle-orm/mysql-core";

export const comptesStaff = mysqlTable(
  "comptes_staff",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    betterAuthUserId: varchar("better_auth_user_id", { length: 36 })
      .notNull()
      .unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    telephone: varchar("telephone", { length: 20 }),
    role: varchar("role", { length: 32 }).notNull(),
    etat: varchar("etat", { length: 32 }).notNull().default("VALIDE"),
    creePar: varchar("cree_par", { length: 36 }),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { fsp: 3 }),
    suspendedAt: timestamp("suspended_at", { fsp: 3 }),
  },
  (table) => [
    index("comptes_staff_role_etat_idx").on(table.role, table.etat),
    index("comptes_staff_cree_par_idx").on(table.creePar),
  ],
);

export type CompteStaff = typeof comptesStaff.$inferSelect;
export type NouveauCompteStaff = typeof comptesStaff.$inferInsert;
