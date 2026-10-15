// S2 — Liste fermée des permissions. Source : .scratch/s2 issues 02.
// Écrite dans le code, non modifiable à l'exécution : une permission
// invoquée ne peut pas inexist er. Une spec qui introduit une action
// métier nouvelle ajoute son nom ici — elle ne contourne pas la liste.

export const PERMISSIONS_FERMEES = [
  // Écriture financière (S3, S6)
  "taux.saisir",
  "creance.creer",
  "paiement.creer",
  "ecriture.corriger",
  // Trésorerie (S7)
  "tresorerie.mouvement",
  // Plafond et statut (S4)
  "plafond.modifier",
  "statut.modifier",
  // Dossier client (S4)
  "dossier.creer",
  "dossier.rattacher",
  "dossier.detacher",
  // Grille tarifaire (S5)
  "grille.tarif",
  // Preuve de paiement (S5)
  "preuve.valider",
  // Commande (S5)
  "commande.creer",
  "commande.prendre",
  "commande.servir",
  "commande.annuler",
  // Réconciliation (S8)
  "reconciliation.trancher",
  // Journal (S2)
  "journal.consulter",
  // Validation des comptes clients (S1-03)
  "client.valider",
  // Annotations client (S4 issue #7) : poser/retirer une étiquette.
  "client.annoter",
] as const;

export type Permission = (typeof PERMISSIONS_FERMEES)[number];

/** Une permission inconnue vaut refus, jamais accès libre. */
export function estPermissionConnue(permission: string): permission is Permission {
  return (PERMISSIONS_FERMEES as readonly string[]).includes(permission);
}

/**
 * Raccourci d'embauche : le profil prédéfini de l'agent de service.
 * Simple point de départ — l'administrateur peut retirer n'importe quelle
 * permission ensuite, et ce retrait fait foi (le profil ne réaccorde rien).
 * Volontairement sans pouvoir sensible : ni taux, ni plafond, ni statut,
 * ni grille, ni réconciliation, ni journal.
 */
/**
 * Ouvrir un dossier client : le distributeur (administrateur principal
 * validé) d'office. L'agent passe par la permission `dossier.creer`,
 * vérifiée à l'appel. L'administrateur technique n'ouvre jamais de
 * dossier : aucun pouvoir métier (GLOSSARY).
 */
export function peutOuvrirDossier(
  roleDemandeur: string,
  etatDemandeur: string,
): boolean {
  return roleDemandeur === "ADMIN_PRINCIPAL" && etatDemandeur === "VALIDE";
}

export const PROFIL_AGENT_SERVICE_DEFAUT: readonly Permission[] = [
  "dossier.creer",
  "commande.creer",
  "commande.prendre",
  "commande.servir",
  "commande.annuler",
  "preuve.valider",
  "paiement.creer",
  "client.valider",
  "client.annoter",
];

/** Seul un administrateur principal VALIDE accorde ou retire (S2). */
export function peutGererPermissions(
  roleDemandeur: string,
  etatDemandeur: string,
): boolean {
  return roleDemandeur === "ADMIN_PRINCIPAL" && etatDemandeur === "VALIDE";
}

/** Lecture du journal : principal ou technique, toujours VALIDE. */
export function peutConsulterJournal(
  roleDemandeur: string,
  etatDemandeur: string,
): boolean {
  if (etatDemandeur !== "VALIDE") return false;
  return (
    roleDemandeur === "ADMIN_PRINCIPAL" ||
    roleDemandeur === "ADMIN_TECHNIQUE"
  );
}
