import { mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const reglages = mysqlTable("reglages", {
  cle: varchar("cle", { length: 64 }).primaryKey(),
  valeur: varchar("valeur", { length: 255 }).notNull(),
  modifiePar: varchar("modifie_par", { length: 36 }),
  updatedAt: timestamp("updated_at", { fsp: 3 }).defaultNow().notNull(),
});

export type Reglage = typeof reglages.$inferSelect;
