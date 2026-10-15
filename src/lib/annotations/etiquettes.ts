// Issue #7 — étiquettes d'annotation client, liste fermée.
//
// Même esprit que PERMISSIONS_FERMEES (S2) : la liste vit dans le code et
// n'est PAS modifiable à l'exécution. Une étiquette porte un code stable
// (jamais affiché à l'écran), un libellé français et une teinte.
//
// Ce n'est pas du scoring : aucune note, aucun seuil, aucune probabilité.
// L'étiquette est un repère opérationnel posé à la main par un humain
// autorisé (`client.annoter`), pas un calcul. Voir issue #7 et
// .scratch/s4-clients-and-credit-lines/spec.md (hors périmètre « notation »).

export const ETIQUETTES_FERMEES = [
  { code: "A_SURVEILLER", libelle: "À surveiller", teinte: "rouge" },
  { code: "BON_PAYEUR", libelle: "Bon payeur", teinte: "vert" },
  { code: "CLIENT_CONFIANCE", libelle: "Client de confiance", teinte: "bleu" },
] as const;

export type Etiquette = (typeof ETIQUETTES_FERMEES)[number]["code"];
export type TeinteEtiquette = (typeof ETIQUETTES_FERMEES)[number]["teinte"];

/** Une étiquette inconnue vaut refus, jamais une étiquette implicite. */
export function estEtiquetteConnue(code: string): code is Etiquette {
  return (ETIQUETTES_FERMEES as readonly { code: string }[]).some(
    (etiquette) => etiquette.code === code,
  );
}

export function etiquetteParCode(code: string) {
  return (
    ETIQUETTES_FERMEES.find((etiquette) => etiquette.code === code) ?? null
  );
}

/**
 * Ordonne des codes d'étiquettes selon la liste fermée — l'ordre d'affichage
 * ne dépend jamais de l'ordre d'arrivée en base.
 */
export function etiquettesOrdonnees(codes: readonly string[]): string[] {
  const connues = new Set(codes);
  return ETIQUETTES_FERMEES.filter((etiquette) => connues.has(etiquette.code)).map(
    (etiquette) => etiquette.code,
  );
}
