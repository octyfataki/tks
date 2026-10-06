import { mysqlTable, timestamp, varchar, index } from "drizzle-orm/mysql-core";

// S1 stories 5-8 + docs/db/01-admin-comptes.md.
// Le lien fixe le rôle (toujours AGENT), jamais l'identifiant : l'agent choisit
// son email au moment de s'inscrire. Ne peut pas créer un admin, jamais un client.
// Usage unique : même jeton présenté deux fois = un seul compte (idempotence,
// y compris offline puis synchro via op_id — voir acceptInvitationAgent).
export const invitationsAgents = mysqlTable(
  "invitations_agents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jeton: varchar("jeton", { length: 255 }).notNull().unique(),
    roleCible: varchar("role_cible", { length: 32 }).notNull().default("AGENT"),
    expireLe: timestamp("expire_le", { fsp: 3 }).notNull(),
    consommeLe: timestamp("consomme_le", { fsp: 3 }),
    consommePar: varchar("consomme_par", { length: 36 }),
    creePar: varchar("cree_par", { length: 36 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("invitations_agents_cree_par_idx").on(table.creePar)],
);

export type InvitationAgent = typeof invitationsAgents.$inferSelect;
export type NouvelleInvitationAgent = typeof invitationsAgents.$inferInsert;
