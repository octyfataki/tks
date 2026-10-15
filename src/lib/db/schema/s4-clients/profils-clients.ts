import { index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

// S4-T1 (issue #34) + spec S4 refondue (issue #32) — le profil client est la
// boutique elle-même. Le compte (S1) est un moyen d'accès ; il ne porte
// aucune donnée financière. Les opérations (commandes, créances, paiements)
// se rattacheront à ce profil stable, jamais au téléphone.
//
// - `nom` libre et NON UNIQUE : deux homonymes restent deux profils (test
//   d'acceptation 1). Le nom sert à désigner, jamais à identifier.
// - `contactTelephone` normalisé, INDEXÉ mais NON UNIQUE : plusieurs
//   boutiques peuvent partager un contact (test 2). Contraste volontaire
//   avec `comptesClients.telephone`, UNIQUE comme identifiant de compte.
// - `statut` EN_EVALUATION par défaut ; seul PRIVILEGIE commandera crédit
//   (règles appliquées en couche s4-clients, tranche ultérieure).
// - `plafondMontant` + `plafondDevise` : une décision du distributeur, pas
//   un fait comptable. Comparaison à devises égales, sans conversion
//   (ADR-0001). Le disponible reste DÉRIVÉ, jamais stocké (invariant 1) :
//   aucune colonne dette/disponible/solde ici.
// - Réplicable (invariant 9, offline-first) : `id` généré sur l'appareil,
//   `horodatageLocal` conservé tel quel, `recuLe` à la réception serveur.
// - `creePar` toujours renseigné : date et auteur traçables (user story 6),
//   toute action attribuée (invariant 8).
export const profilsClients = mysqlTable(
  "profils_clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    nom: varchar("nom", { length: 255 }).notNull(),
    // Texte libre, comme aujourd'hui (pas d'adresse structurée : hors
    // périmètre S4).
    adresse: varchar("adresse", { length: 500 }),
    contactTelephone: varchar("contact_telephone", { length: 32 }).notNull(),
    // EN_EVALUATION | PRIVILEGIE — valeurs fermées vérifiées côté
    // applicatif (voir statuts ci-dessous).
    statut: varchar("statut", { length: 16 })
      .notNull()
      .default("EN_EVALUATION"),
    // Montant entier strictement positif (validé applicativement), comme
    // `tauxChange.valeur`. La devise native du plafond : USD ou CDF.
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

/** Un statut inconnu vaut refus, jamais un état implicite. */
export function estStatutProfil(statut: string): statut is StatutProfil {
  return (STATUTS_PROFIL as readonly string[]).includes(statut);
}

export const DEVISES_PLAFOND = ["USD", "CDF"] as const;
export type DevisePlafond = (typeof DEVISES_PLAFOND)[number];

/** Une devise inconnue vaut refus, jamais une conversion implicite. */
export function estDevisePlafond(devise: string): devise is DevisePlafond {
  return (DEVISES_PLAFOND as readonly string[]).includes(devise);
}

export type ProfilClient = typeof profilsClients.$inferSelect;
export type NouveauProfilClient = typeof profilsClients.$inferInsert;
