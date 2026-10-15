export const PERMISSIONS_FERMEES = [
  "taux.saisir",
  "creance.creer",
  "paiement.creer",
  "ecriture.corriger",
  "tresorerie.mouvement",
  "plafond.modifier",
  "statut.modifier",
  "dossier.creer",
  "dossier.rattacher",
  "dossier.detacher",
  "grille.tarif",
  "preuve.valider",
  "commande.creer",
  "commande.prendre",
  "commande.servir",
  "commande.annuler",
  "reconciliation.trancher",
  "journal.consulter",
  "client.valider",
  "client.annoter",
] as const;

export type Permission = (typeof PERMISSIONS_FERMEES)[number];

export function estPermissionConnue(permission: string): permission is Permission {
  return (PERMISSIONS_FERMEES as readonly string[]).includes(permission);
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

export function peutGererPermissions(
  roleDemandeur: string,
  etatDemandeur: string,
): boolean {
  return roleDemandeur === "ADMIN_PRINCIPAL" && etatDemandeur === "VALIDE";
}

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
