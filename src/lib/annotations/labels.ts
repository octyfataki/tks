export const ETIQUETTES_FERMEES = [
  { code: "A_SURVEILLER", libelle: "À surveiller", teinte: "rouge" },
  { code: "BON_PAYEUR", libelle: "Bon payeur", teinte: "vert" },
  { code: "CLIENT_CONFIANCE", libelle: "Client de confiance", teinte: "bleu" },
] as const;

export type Etiquette = (typeof ETIQUETTES_FERMEES)[number]["code"];
export type TeinteEtiquette = (typeof ETIQUETTES_FERMEES)[number]["teinte"];

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

export function etiquettesOrdonnees(codes: readonly string[]): string[] {
  const connues = new Set(codes);
  return ETIQUETTES_FERMEES.filter((etiquette) => connues.has(etiquette.code)).map(
    (etiquette) => etiquette.code,
  );
}
