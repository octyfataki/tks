import { index, int, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const cashAccounts = mysqlTable(
  "cash_accounts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    type: varchar("type", { length: 20 }).notNull(),
    network: varchar("network", { length: 32 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    openingAmount: int("opening_amount", { unsigned: true }).notNull(),
    openedAt: timestamp("opened_at", { fsp: 3 }).notNull(),
    openedBy: varchar("opened_by", { length: 36 }).notNull(),
    deviceId: varchar("device_id", { length: 64 }),
    receivedAt: timestamp("received_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("cash_accounts_type_network_currency_uk").on(
      table.type,
      table.network,
      table.currency,
    ),
    index("cash_accounts_opened_at_idx").on(table.openedAt),
  ],
);

export type CashAccountsRow = typeof cashAccounts.$inferSelect;
export type NewCashAccountsRow = typeof cashAccounts.$inferInsert;

export const cashMovements = mysqlTable(
  "cash_movements",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: varchar("account_id", { length: 36 }).notNull(),
    kind: varchar("kind", { length: 12 }).notNull(),
    direction: varchar("direction", { length: 4 }).notNull(),
    category: varchar("category", { length: 20 }).notNull(),
    amount: int("amount", { unsigned: true }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    description: varchar("description", { length: 400 }),
    occurredAt: timestamp("occurred_at", { fsp: 3 }).notNull(),
    enteredBy: varchar("entered_by", { length: 36 }).notNull(),
    sourceKind: varchar("source_kind", { length: 10 }).notNull(),
    sourceId: varchar("source_id", { length: 36 }),
    transferId: varchar("transfer_id", { length: 36 }),
    correctedOf: varchar("corrected_of", { length: 36 }),
    deviceId: varchar("device_id", { length: 64 }),
    receivedAt: timestamp("received_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("cash_movements_account_occurred_idx").on(
      table.accountId,
      table.occurredAt,
    ),
    index("cash_movements_category_occurred_idx").on(
      table.category,
      table.occurredAt,
    ),
    index("cash_movements_transfer_idx").on(table.transferId),
    index("cash_movements_corrected_of_idx").on(table.correctedOf),
    index("cash_movements_entered_by_idx").on(table.enteredBy),
  ],
);

export type CashMovementsRow = typeof cashMovements.$inferSelect;
export type NewCashMovementsRow = typeof cashMovements.$inferInsert;
