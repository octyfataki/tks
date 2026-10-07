import { mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

// Réglages métier modifiables depuis /admin/parametres. Table clé/valeur :
// seules les clés fermées de CLES_REGLAGES existent, toute autre clé est
// refusée côté applicatif (liste fermée, comme les permissions S2).
// Aujourd'hui : seule la durée par défaut des invitations est persistée.
// Le taux (S3) et le plafond (S4) vivent dans leurs specs quand elles
// arriveront — la page Paramètres les affiche en lecture seule jusque-là.
export const reglages = mysqlTable("reglages", {
  cle: varchar("cle", { length: 64 }).primaryKey(),
  valeur: varchar("valeur", { length: 255 }).notNull(),
  modifiePar: varchar("modifie_par", { length: 36 }),
  updatedAt: timestamp("updated_at", { fsp: 3 }).defaultNow().notNull(),
});

export type Reglage = typeof reglages.$inferSelect;
