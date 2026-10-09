import { mysqlTable, timestamp, varchar, index } from "drizzle-orm/mysql-core";

// S1-01 + docs/db/02-comptes-clients.md — tableau réservé aux clients.
// Un compte client est une connexion, jamais un dossier (GLOSSARY) : il peut
// exister seul, en EN_ATTENTE_VALIDATION, sans dossier, sans créance, sans
// commande. Le rattachement au dossier vit en S4.
//
// ÉCART ASSUMÉ à S1-spec (« téléphone + mot de passe, aucun email ») et à
// ADR-0006 (« username() téléphone pour les clients ») : l'identifiant
// technique de connexion est l'email via `emailAndPassword`, comme tout le
// socle existant (voir src/lib/auth.ts). Le téléphone reste la clé métier du
// compte — UNIQUE, jamais celle du dossier — et une seconde inscription avec
// le même numéro est refusée. Le jour où le plugin `username()` sera branché,
// c'est cette table qui portera la bascule, pas les écrans.
// Règles applicatives (tout applicatif, voir validation.ts) :
// - etat EN_ATTENTE_VALIDATION | VALIDE | REFUSE | REVOQUE (voir
//   ETATS_CLIENT / transitionCompteClientValide).
// - l'inscription crée EN_ATTENTE_VALIDATION, qui ne peut rien faire.
// - valider exige une pièce d'identité vue par un humain (S1-03) : aucun
//   chemin ne produit VALIDE sans pièce.
export const comptesClients = mysqlTable(
  "comptes_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    betterAuthUserId: varchar("better_auth_user_id", { length: 36 })
      .notNull()
      .unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    telephone: varchar("telephone", { length: 32 }).notNull().unique(),
    // VARCHAR (pas TEXT) : MySQL ne peut pas indexer une colonne TEXT sans
    // longueur de préfixe, et (etat) est indexé pour la file d'attente.
    // Valeurs fermées vérifiées côté applicatif (validation.ts).
    etat: varchar("etat", { length: 32 })
      .notNull()
      .default("EN_ATTENTE_VALIDATION"),
    creePar: varchar("cree_par", { length: 36 }),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    valideLe: timestamp("valide_le", { fsp: 3 }),
    refuseMotif: varchar("refuse_motif", { length: 500 }),
  },
  (table) => [
    index("comptes_clients_etat_idx").on(table.etat),
    index("comptes_clients_cree_par_idx").on(table.creePar),
  ],
);

export type CompteClient = typeof comptesClients.$inferSelect;
export type NouveauCompteClient = typeof comptesClients.$inferInsert;
