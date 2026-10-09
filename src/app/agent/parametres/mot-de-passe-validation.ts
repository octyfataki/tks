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
