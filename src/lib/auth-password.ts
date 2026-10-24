export const LONGUEUR_MOT_DE_PASSE_MIN = 8;

export function motDePasseTropCourt(valeur: string): boolean {
  return valeur.length < LONGUEUR_MOT_DE_PASSE_MIN;
}
