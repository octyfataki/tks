import {
  index,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// S2 issues 02-03 — une permission accordée à un agent précis.
// Zéro ligne par défaut : un agent créé n'a rien (l'absence vaut refus).
// Le profil prédéfini (validation.ts) n'a aucun pouvoir propre : il ne
// fait qu'insérer des lignes, retirables une par une.
export const permissionsAgents = mysqlTable(
  "permissions_agents",
  {
    agentId: varchar("agent_id", { length: 36 }).notNull(),
    permission: varchar("permission", { length: 64 }).notNull(),
    accordePar: varchar("accorde_par", { length: 36 }).notNull(),
    accordeLe: timestamp("accorde_le", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.agentId, table.permission] }),
    index("permissions_agents_agent_idx").on(table.agentId),
    index("permissions_agents_permission_idx").on(table.permission),
  ],
);

export type PermissionAgent = typeof permissionsAgents.$inferSelect;
export type NouvellePermissionAgent = typeof permissionsAgents.$inferInsert;
