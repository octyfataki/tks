import {
  index,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// S2 issues 02-03 — une permission accordée à un agent précis.
// Zéro ligne par défaut : un agent créé n'a rien en individuel (l'absence
// vaut refus). Le socle global (permissions_socle_agents, ci-dessous)
// s'ajoute à l'individuel : effectif = socle ∪ individuel.
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

// Socle de base commun à tous les agents de service (page
// /admin/agents/permissions). Une ligne = accordée à tous, y compris aux
// agents créés après. L'individuel (ci-dessus) ne fait qu'ajouter des
// exceptions par agent. Table réplicable comme le reste (S8) : permission
// en clé primaire, horodatage conservé.
export const permissionsSocleAgents = mysqlTable("permissions_socle_agents", {
  permission: varchar("permission", { length: 64 }).primaryKey(),
  accordePar: varchar("accorde_par", { length: 36 }).notNull(),
  accordeLe: timestamp("accorde_le", { fsp: 3 }).defaultNow().notNull(),
});

export type PermissionSocle = typeof permissionsSocleAgents.$inferSelect;
export type NouvellePermissionSocle = typeof permissionsSocleAgents.$inferInsert;
