import { mysqlTable, timestamp, varchar, index } from "drizzle-orm/mysql-core";

export const invitationsAgents = mysqlTable(
  "invitations_agents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jeton: varchar("jeton", { length: 255 }).notNull().unique(),
    roleCible: varchar("role_cible", { length: 32 }).notNull().default("AGENT"),
    expireLe: timestamp("expire_le", { fsp: 3 }).notNull(),
    consommeLe: timestamp("consomme_le", { fsp: 3 }),
    consommePar: varchar("consomme_par", { length: 36 }),
    revoqueLe: timestamp("revoque_le", { fsp: 3 }),
    creePar: varchar("cree_par", { length: 36 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("invitations_agents_cree_par_idx").on(table.creePar)],
);

export type InvitationAgent = typeof invitationsAgents.$inferSelect;
export type NouvelleInvitationAgent = typeof invitationsAgents.$inferInsert;
