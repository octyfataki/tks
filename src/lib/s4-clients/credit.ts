import type { DevisePlafond, StatutProfil } from "@/lib/db/schema/s4-clients";

export type TypeCommandeCredit = "PREPAYE" | "CREDIT";

export type ExpositionDevise = {
  devise: string;
  montant: number;
};

export type DecisionCredit =
  | { autorise: true; plafondRestant: number; devise: DevisePlafond }
  | {
      autorise: false;
      code:
        | "STATUT_INSUFFISANT"
        | "DEVISE_INCOHERENTE"
        | "PLAFOND_DEPASSE"
        | "PLAFOND_DEJA_DEPASSE";
      motif: string;
    };

/**
 * Somme des créances **dans la devise du plafond**. Les autres devises ne sont
 * ni converties, ni additionnées : un plafond libellé en USD se compare aux
 * créances en USD. Le taux du jour ne parle pas ici — un plafond est une
 * décision du chef, pas un fait, donc sa valeur ne bouge pas quand le dollar
 * bouge (S4, ADR-0001).
 */
export function expositionDansDevise(
  expositions: readonly ExpositionDevise[],
  devise: DevisePlafond,
): number {
  return expositions
    .filter((exposition) => exposition.devise === devise)
    .reduce((total, exposition) => total + exposition.montant, 0);
}

export function plafondRestant(input: {
  plafondMontant: number;
  plafondDevise: DevisePlafond;
  expositions: readonly ExpositionDevise[];
}): number {
  return (
    input.plafondMontant - expositionDansDevise(input.expositions, input.plafondDevise)
  );
}

/**
 * Décide si une commande passe. Le plafond est déjà dépassé (le chef l'a
 * abaissé sous la dette existante) : c'est signalé, et rien n'est autorisé —
 * ce n'est pas une erreur de saisie, c'est un état à voir.
 */
export function deciderCommandeCredit(input: {
  statut: StatutProfil;
  typeCommande: TypeCommandeCredit;
  montantCommande: number;
  deviseCommande: DevisePlafond;
  plafondMontant: number;
  plafondDevise: DevisePlafond;
  expositions: readonly ExpositionDevise[];
}): DecisionCredit {
  if (input.typeCommande === "PREPAYE") {
    return {
      autorise: true,
      plafondRestant: plafondRestant(input),
      devise: input.plafondDevise,
    };
  }

  if (input.statut !== "PRIVILEGIE") {
    return {
      autorise: false,
      code: "STATUT_INSUFFISANT",
      motif: "Un client en évaluation doit prépayer : la promotion est une décision de l'administrateur principal.",
    };
  }

  if (input.deviseCommande !== input.plafondDevise) {
    return {
      autorise: false,
      code: "DEVISE_INCOHERENTE",
      motif: `Le plafond est libellé en ${input.plafondDevise} : une commande crédit dans une autre devise ne s'y compare pas.`,
    };
  }

  const restant = plafondRestant(input);
  if (restant <= 0) {
    return {
      autorise: false,
      code: "PLAFOND_DEJA_DEPASSE",
      motif: "Le plafond est déjà atteint. Aucune nouvelle commande crédit n'est possible tant que la dette ne baisse pas.",
    };
  }

  if (input.montantCommande > restant) {
    return {
      autorise: false,
      code: "PLAFOND_DEPASSE",
      motif: `Commande refusée : il reste ${restant} ${input.plafondDevise} disponibles sur ${input.plafondMontant}.`,
    };
  }

  return {
    autorise: true,
    plafondRestant: restant - input.montantCommande,
    devise: input.plafondDevise,
  };
}