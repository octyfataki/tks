import {
  index,
  int,
  json,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const orders = mysqlTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    profileId: varchar("profile_id", { length: 36 }).notNull(),
    network: varchar("network", { length: 32 }).notNull(),
    channel: varchar("channel", { length: 16 }).notNull(),
    type: varchar("type", { length: 16 }).notNull(),
    units: int("units", { unsigned: true }).notNull(),
    pricePerHundred: int("price_per_hundred", { unsigned: true }).notNull(),
    amount: int("amount", { unsigned: true }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    createdBy: varchar("created_by", { length: 36 }),
    localTimestamp: timestamp("local_timestamp", { fsp: 3 }).notNull(),
    deviceId: varchar("device_id", { length: 64 }),
    receivedAt: timestamp("received_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_profile_idx").on(table.profileId),
    index("orders_local_timestamp_idx").on(table.localTimestamp),
    index("orders_network_idx").on(table.network),
  ],
);

export const orderEvents = mysqlTable(
  "order_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orderId: varchar("order_id", { length: 36 }).notNull(),
    kind: varchar("kind", { length: 32 }).notNull(),
    actorId: varchar("actor_id", { length: 36 }),
    payload: json("payload").$type<unknown>(),
    localTimestamp: timestamp("local_timestamp", { fsp: 3 }).notNull(),
    deviceId: varchar("device_id", { length: 64 }),
    receivedAt: timestamp("received_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("order_events_order_idx").on(table.orderId),
    index("order_events_kind_idx").on(table.kind),
  ],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderEventRow = typeof orderEvents.$inferSelect;
export type NewOrderEventRow = typeof orderEvents.$inferInsert;
