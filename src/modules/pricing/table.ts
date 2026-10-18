import { index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const priceGrid = mysqlTable(
  "price_grid",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    network: varchar("network", { length: 32 }).notNull(),
    amount: int("amount", { unsigned: true }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    effectiveAt: timestamp("effective_at", { fsp: 3 }).notNull(),
    enteredBy: varchar("entered_by", { length: 36 }).notNull(),
    deviceId: varchar("device_id", { length: 64 }),
    receivedAt: timestamp("received_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("price_grid_network_effective_at_idx").on(
      table.network,
      table.effectiveAt,
    ),
    index("price_grid_effective_at_idx").on(table.effectiveAt),
    index("price_grid_entered_by_idx").on(table.enteredBy),
  ],
);

export type PriceGridRow = typeof priceGrid.$inferSelect;
export type NewPriceGridRow = typeof priceGrid.$inferInsert;
