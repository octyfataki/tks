/**
 * Annuaire de raccourcis de la page d'aide (/aide).
 *
 * Trois rubriques, une par niveau : Aide Client, Aide Agent, Aide Admin.
 * Quand on est perdu, on vient y chercher le raccourci vers une page ou
 * une fonctionnalité liée à son niveau.
 *
 * Règles (mêmes que la palette de recherche) :
 * - un raccourci ne porte un `href` que si l'écran existe vraiment ;
 * - sans `href`, l'entrée s'affiche « Bientôt » — jamais de lien mort ;
 * - vocabulaire GLOSSARY.md strict : « client » jamais « shop », « commande »
 *   jamais « réalisation », « preuve de paiement » jamais « facture ».
 */

import type { Profil } from "@/lib/s1-comptes/role-session";
import { DESTINATION_CONNEXION } from "@/lib/s1-comptes/role-session";

export type AideNiveau = "Client" | "Agent" | "Admin";

export type AideRaccourci = {
  label: string;
  description: string;
  /** Absent = écran pas encore construit : affiché « Bientôt », sans lien. */
  href?: string;
  motsCles?: string[];
};

export type AideSectionNiveau = {
  niveau: AideNiveau;
  phrase: string;
  raccourcis: AideRaccourci[];
  astuce?: string;
};

export const AIDE_NIVEAUX: ("Tous" | AideNiveau)[] = [
  "Tous",
  "Client",
  "Agent",
  "Admin",
];

export const AIDE_SECTIONS: AideSectionNiveau[] = [
  {
    niveau: "Client",
    phrase: "Votre espace : compte, dossier, commandes et soldes.",
    raccourcis: [
      {
        label: "Votre compte",
        description: "Dossier, commandes et soldes (lignes de crédit : S4).",
        href: "/clients",
        motsCles: ["compte", "dossier", "solde", "accueil", "espace"],
      },
      {
        label: "Mon compte",
        description: "Connexion et état de votre compte.",
        href: "/clients/profil",
        motsCles: ["profil", "compte", "connexion"],
      },
      {
        label: "Compte en attente",
        description: "Suivez votre validation après l'inscription.",
        href: "/pending",
        motsCles: ["attente", "validation", "inscription"],
      },
      {
        label: "Inscription",
        description: "Créez votre compte, validé sur pièce d'identité.",
        href: "/sign-up",
        motsCles: ["inscription", "créer", "compte"],
      },
      {
        label: "Connexion",
        description: "Téléphone puis mot de passe.",
        href: "/sign-in",
        motsCles: ["connexion", "login"],
      },
      {
        label: "Mot de passe oublié",
        description: "Remis par le distributeur, sur pièce d'identité.",
        href: "/forgot-password",
        motsCles: ["oublié", "mot de passe", "perdu"],
      },
    ],
    astuce:
      "Un compte non validé ne voit ni dossier ni solde : présentez une pièce d'identité au comptoir.",
  },
  {
    niveau: "Agent",
    phrase: "Comptoir et terrain, même sans réseau.",
    raccourcis: [
      {
        label: "Tableau de bord agent",
        description: "Service des commandes et encaissement au comptoir.",
        href: "/agent/dashboard",
        motsCles: ["tableau", "bord", "accueil", "espace", "agent"],
      },
      {
        label: "Mon compte",
        description: "Connexion et état de votre compte.",
        href: "/agent/profil",
        motsCles: ["profil", "compte"],
      },
      {
        label: "Connexion",
        description: "Agents comme clients : téléphone puis mot de passe.",
        href: "/sign-in",
        motsCles: ["connexion", "login"],
      },
      {
        label: "File d'attente des commandes",
        description: "Commandes à servir, verrou local au comptoir.",
        motsCles: ["commande", "file", "attente", "servir"],
      },
      {
        label: "Caisse rapide",
        description: "Vente présentielle en espèces, le parcours le plus court.",
        motsCles: ["caisse", "comptoir", "espèces", "rapide", "vente"],
      },
      {
        label: "Preuves de paiement",
        description: "Images téléversées par le client, à valider ou refuser.",
        motsCles: ["preuve", "paiement", "mobile money", "valider"],
      },
      {
        label: "Encaissements",
        description: "Un paiement, sa devise, son solde recalculé.",
        motsCles: ["encaisser", "paiement", "remboursement"],
      },
    ],
    astuce:
      "Lien d'invitation reçu ? Ouvrez-le dans le navigateur : il crée votre compte agent, à valider ensuite.",
  },
  {
    niveau: "Admin",
    phrase: "Pilotage et socle : inviter, suivre l'argent, diagnostiquer.",
    raccourcis: [
      {
        label: "Tableau de bord",
        description: "Matin du chef : jour en cours, dettes à relancer.",
        href: "/admin/dashboard",
        motsCles: ["tableau", "bord", "pilotage", "accueil", "diagnostic"],
      },
      {
        label: "Inviter un agent",
        description: "Lien à usage unique, à durée limitée.",
        href: "/admin/invites",
        motsCles: ["agent", "inviter", "lien", "service"],
      },
      {
        label: "Notifications",
        description: "Preuves en attente et conflits ouverts.",
        href: "/admin/notifications",
        motsCles: ["notification", "alerte", "preuve", "conflit"],
      },
      {
        label: "Administrateurs principaux",
        description: "Créer le distributeur : direct ou par lien d'invitation.",
        href: "/admin/list",
        motsCles: ["administrateur", "principal", "distributeur", "technique", "créer"],
      },
      {
        label: "Second facteur",
        description: "Connexion avec second facteur obligatoire.",
        href: "/verify-2fa",
        motsCles: ["2fa", "second", "facteur", "code"],
      },
      {
        label: "Mon compte",
        description: "Connexion et état de votre compte.",
        href: "/admin/profil",
        motsCles: ["profil", "compte"],
      },
      {
        label: "Tous les dossiers",
        description: "Dossiers désignés par nom, adresse et solde.",
        motsCles: ["dossier", "client", "fiche", "nom"],
      },
      {
        label: "Taux de change",
        description: "1 USD = X CDF, saisi une fois par jour.",
        motsCles: ["taux", "dollar", "usd", "cdf", "change"],
      },
      {
        label: "Caisse et mobile money",
        description: "Espèces plus un compte par réseau.",
        motsCles: ["caisse", "mobile money", "trésorerie"],
      },
      {
        label: "Journal d'audit",
        description: "Qui, quand, quoi : ni modifié ni supprimé.",
        motsCles: ["audit", "journal", "traçabilité"],
      },
    ],
    astuce:
      "Promotion et plafond : décisions humaines. Compte technique : ni taux, ni plafond, ni promotion — tout est tracé.",
  },
];

/** Écrans annoncés mais pas encore construits : rappel commun, sans liens. */
export const AIDE_BIENTOT: { theme: string; entrees: string[] }[] = [
  {
    theme: "Clients et crédit",
    entrees: ["Suivi des retards", "Statuts et plafonds", "Créances et dettes"],
  },
  {
    theme: "Opérations",
    entrees: ["Grille tarifaire"],
  },
  {
    theme: "Pilotage",
    entrees: ["Alertes et réconciliation"],
  },
];

/**
 * Répartiteur d'aide (logique pure, testée) : chaque type d'utilisateur
 * connecté atterrit sur l'aide de son niveau, jamais sur celle d'un autre.
 * Anonyme, inconnu ou non validé : retour à la connexion.
 */
export function destinationAide(profil: Profil): string {
  if (profil.type === "CLIENT") return "/clients/aide";
  if (profil.type === "STAFF" && profil.etat === "VALIDE") {
    return profil.role === "AGENT" ? "/agent/aide" : "/admin/aide";
  }
  return DESTINATION_CONNEXION;
}
