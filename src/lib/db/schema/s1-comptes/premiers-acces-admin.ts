import { mysqlTable, timestamp, varchar, index } from "drizzle-orm/mysql-core";

// Lien de premier accès : après une création directe, la personne choisit
// elle-même son mot de passe via un lien à usage unique, durée 24 h.
// Portée STRICTE : uniquement le choix du mot de passe — jamais une session,
// jamais un contournement du second facteur (la connexion suivante exige
// email + mot de passe + TOTP). Même modèle que invitations_agents : jeton
// aléatoire unique, usage unique, expiration visible.
// La confiance vient du créateur (admin VALIDE qui crée le compte), pas
// d'une pièce : contrairement au reset, aucune pièce n'est exigée ici.
export const premiersAccesAdmin = mysqlTable(
  "premiers_acces_admin",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    compteStaffCible: varchar("compte_staff_cible", { length: 36 }).notNull(),
    jeton: varchar("jeton", { length: 255 }).notNull().unique(),
    expireLe: timestamp("expire_le", { fsp: 3 }).notNull(),
    consommeLe: timestamp("consomme_le", { fsp: 3 }),
    creePar: varchar("cree_par", { length: 36 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("premiers_acces_admin_cible_idx").on(table.compteStaffCible)],
);

export type PremierAccesAdmin = typeof premiersAccesAdmin.$inferSelect;
export type NouveauPremierAccesAdmin = typeof premiersAccesAdmin.$inferInsert;
