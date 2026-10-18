import { index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const profilsClients = mysqlTable(
  "profils_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    nom: varchar("nom", { length: 255 }).notNull(),
    adresse: varchar("adresse", { length: 500 }),
    contactTelephone: varchar("contact_telephone", { length: 32 }).notNull(),
    statut: varchar("statut", { length: 16 })
      .notNull()
      .default("EN_EVALUATION"),
    plafondMontant: int("plafond_montant", { unsigned: true }).notNull(),
    plafondDevise: varchar("plafond_devise", { length: 3 }).notNull(),
    creePar: varchar("cree_par", { length: 36 }).notNull(),
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("profils_clients_contact_idx").on(table.contactTelephone),
    index("profils_clients_nom_idx").on(table.nom),
  ],
);

export const STATUTS_PROFIL = ["EN_EVALUATION", "PRIVILEGIE"] as const;
export type StatutProfil = (typeof STATUTS_PROFIL)[number];

export function estStatutProfil(statut: string): statut is StatutProfil {
  return (STATUTS_PROFIL as readonly string[]).includes(statut);
}

export const DEVISES_PLAFOND = ["USD", "CDF"] as const;
export type DevisePlafond = (typeof DEVISES_PLAFOND)[number];

export function estDevisePlafond(devise: string): devise is DevisePlafond {
  return (DEVISES_PLAFOND as readonly string[]).includes(devise);
}

export type ProfilClient = typeof profilsClients.$inferSelect;
export type NouveauProfilClient = typeof profilsClients.$inferInsert;
