import {
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const paymentProofs = mysqlTable(
  "payment_proofs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orderId: varchar("order_id", { length: 36 }).notNull(),
    fileKey: text("file_key").notNull(),
    mime: varchar("mime", { length: 64 }).notNull(),
    sizeBytes: int("size_bytes", { unsigned: true }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("PENDING"),
    refusalReason: varchar("refusal_reason", { length: 500 }),
    submittedBy: varchar("submitted_by", { length: 36 }),
    reviewedBy: varchar("reviewed_by", { length: 36 }),
    reviewedAt: timestamp("reviewed_at", { fsp: 3 }),
    localTimestamp: timestamp("local_timestamp", { fsp: 3 }).notNull(),
    deviceId: varchar("device_id", { length: 64 }),
    receivedAt: timestamp("received_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("payment_proofs_order_idx").on(table.orderId)],
);

export type PaymentProofRow = typeof paymentProofs.$inferSelect;
export type NewPaymentProofRow = typeof paymentProofs.$inferInsert;
