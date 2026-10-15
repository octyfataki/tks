import { index, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// Module clients — table des dossiers financiers (GLOSSARY : le dossier
// est la fiche financière, jamais la connexion).
//
// - `nom` libre et **non unique** : deux homonymes restent deux dossiers,
//   c'est le défaut du prototype qu'on ne réintroduit pas.
// - `contact` **indexé mais non unique** : deux dossiers partagent
//   couramment un téléphone, et le dossier ne se désigne jamais par son
//   seul numéro.
// - `id` et `horodatageLocal` : générés sur l'appareil, conservés tels
//   quels (offline-first, invariant 9). `recuLe` est l'heure serveur.
export const dossiersClients = mysqlTable(
  "dossiers_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    nom: varchar("nom", { length: 255 }).notNull(),
    contact: varchar("contact", { length: 32 }).notNull(),
    adresse: text("adresse").notNull(),
    creePar: varchar("cree_par", { length: 36 }),
    horodatageLocal: timestamp("horodatage_local", { fsp: 3 }).notNull(),
    recuLe: timestamp("recu_le", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("dossiers_clients_contact_idx").on(table.contact)],
);

export type DossierClient = typeof dossiersClients.$inferSelect;
export type NouveauDossierClient = typeof dossiersClients.$inferInsert;
