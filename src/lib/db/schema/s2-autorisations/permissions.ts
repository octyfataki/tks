import {
  index,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

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

export const permissionsSocleAgents = mysqlTable("permissions_socle_agents", {
  permission: varchar("permission", { length: 64 }).primaryKey(),
  accordePar: varchar("accorde_par", { length: 36 }).notNull(),
  accordeLe: timestamp("accorde_le", { fsp: 3 }).defaultNow().notNull(),
});

export type PermissionSocle = typeof permissionsSocleAgents.$inferSelect;
export type NouvellePermissionSocle = typeof permissionsSocleAgents.$inferInsert;
