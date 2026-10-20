import {
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const receivables = mysqlTable(
  "receivables",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    profileId: varchar("profile_id", { length: 36 }).notNull(),
    orderId: varchar("order_id", { length: 36 }),
    amount: int("amount", { unsigned: true }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    occurredAt: timestamp("occurred_at", { fsp: 3 }).notNull(),
    enteredBy: varchar("entered_by", { length: 36 }).notNull(),
    deviceId: varchar("device_id", { length: 64 }),
    receivedAt: timestamp("received_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("receivables_order_unique").on(table.orderId),
    index("receivables_profile_currency_idx").on(
      table.profileId,
      table.currency,
    ),
  ],
);

export type ReceivableRow = typeof receivables.$inferSelect;
export type NewReceivableRow = typeof receivables.$inferInsert;
