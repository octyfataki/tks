/**
 * Validation du changement de mot de passe (agent de service).
 *
 * Règle unique : même exigence qu'à l'inscription — au moins 8 caractères
 * (`minPasswordLength` dans `src/lib/auth.ts`) — plus la confirmation qui
 * doit correspondre. Pure et testée sans réseau.
 */

export function validerChangementMotDePasse(input: {
  actuel: string;
  nouveau: string;
  confirmation: string;
}): string | null {
  if (!input.actuel) {
    return "Saisissez votre mot de passe actuel.";
  }
  if (input.nouveau.length < 8) {
    return "Le nouveau mot de passe doit compter au moins 8 caractères.";
  }
  if (input.nouveau !== input.confirmation) {
    return "La confirmation ne correspond pas au nouveau mot de passe.";
  }
  if (input.nouveau === input.actuel) {
    return "Le nouveau mot de passe doit être différent de l'actuel.";
  }
  return null;
}

export type NiveauForceMotDePasse = 0 | 1 | 2 | 3 | 4;

export type ForceMotDePasse = {
  niveau: NiveauForceMotDePasse;
  etiquette: string;
};

/**
 * Force du nouveau mot de passe, affichée en direct sous le champ.
 * Cohérente avec la règle de validation : moins de 8 caractères, c'est
 * toujours « Trop court ». Au-delà, longueur et variété font monter le
 * niveau. Pure et testée.
 */
export function evaluerForceMotDePasse(motDePasse: string): ForceMotDePasse {
  if (motDePasse.length < 8) {
    return { niveau: 0, etiquette: "Trop court" };
  }
  let score = 1;
  if (motDePasse.length >= 12) score += 1;
  if (/\d/.test(motDePasse)) score += 1;
  if (/[a-z]/.test(motDePasse) && /[A-Z]/.test(motDePasse)) score += 1;
  if (/[^A-Za-z0-9]/.test(motDePasse)) score += 1;
  const niveau = Math.min(score, 4) as NiveauForceMotDePasse;
  const etiquettes: Record<NiveauForceMotDePasse, string> = {
    0: "Trop court",
    1: "Faible",
    2: "Moyen",
    3: "Bien",
    4: "Fort",
  };
  return { niveau, etiquette: etiquettes[niveau] };
}
