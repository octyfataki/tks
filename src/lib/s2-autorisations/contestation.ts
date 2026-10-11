// S2 issue 15 — quelles actions correctives une ligne du journal admet-elle ?
// Pur, sans E/S : la page journal l'utilise pour proposer (ou expliquer
// l'absence de) la contestation. Toute correction proposée ici s'exécute
// comme une NOUVELLE ligne liée (`contesteId`) — jamais une suppression ni
// une modification (invariants 8 et 10).

export type CorrectiveProposee = {
  /** Clé stable, reprise par l'interface pour appeler le bon geste. */
  cle:
    | "client.revoquer"
    | "permission.retirer"
    | "permission.socle.retirer"
    | "agent.suspendre"
    | "agent.revoquer";
  /** Libellé du bouton, vocabulaire GLOSSARY. */
  libelle: string;
};

export type ContestationPossible =
  | { contestable: true; correctives: CorrectiveProposee[] }
  | { contestable: false; explication: string };

/**
 * Correctives applicables à une ligne RÉUSSIE. Une ligne échouée n'a rien
 * produit : la contester n'aurait aucun sens. Une action inconnue n'offre
 * rien plutôt qu'un bouton mensonger.
 */
export function correctivesPour(input: {
  typeAction: string;
  statut: string;
}): ContestationPossible {
  if (input.statut !== "REUSSIE") {
    return {
      contestable: false,
      explication: "Une action échouée n'a rien produit : il n'y a rien à corriger.",
    };
  }
  switch (input.typeAction) {
    case "client.valider":
    case "client.inscrire":
      return {
        contestable: true,
        correctives: [
          { cle: "client.revoquer", libelle: "Révoquer ce compte" },
        ],
      };
    case "permission.accorder":
      return {
        contestable: true,
        correctives: [
          { cle: "permission.retirer", libelle: "Retirer cette permission" },
        ],
      };
    case "permission.socle.accorder":
      return {
        contestable: true,
        correctives: [
          {
            cle: "permission.socle.retirer",
            libelle: "Retirer cette permission du socle",
          },
        ],
      };
    case "permission.profil":
      return {
        contestable: false,
        explication:
          "Un profil ajoute plusieurs permissions : retirez-les une par une depuis la page des permissions de l'agent.",
      };
    case "agent.creer":
    case "agent.inscrire":
      return {
        contestable: true,
        correctives: [
          { cle: "agent.suspendre", libelle: "Suspendre cet agent" },
          { cle: "agent.revoquer", libelle: "Révoquer cet agent" },
        ],
      };
    case "taux.saisir":
      return {
        contestable: false,
        explication:
          "Un taux saisi n'est jamais écrasé : la correction passe par un taux d'ajustement daté et tracé.",
      };
    case "client.revoquer":
    case "agent.revoquer":
    case "admin.revoquer":
      return {
        contestable: false,
        explication:
          "Une révocation est définitive : rouvrir passe par recréation, pas par annulation.",
      };
    default:
      return {
        contestable: false,
        explication: "Aucune action corrective n'est définie pour cette action.",
      };
  }
}
