import { estAdminTechnique } from "@/lib/db/schema/accounts/validation";

export const MOTIF_COORDONNEES_ROLE =
  "Lecture seule : le rôle d'administrateur technique ne permet pas de corriger vos coordonnées.";
export const MOTIF_COORDONNEES_ETAT =
  "Lecture seule : votre compte ne permet pas la correction.";

export { peutModifierSesCoordonnees } from "@/lib/db/schema/accounts/validation";

export function motifCoordonneesVerrouillees(role: string, etat: string): string {
  if (etat !== "VALIDE") return MOTIF_COORDONNEES_ETAT;
  if (estAdminTechnique(role)) return MOTIF_COORDONNEES_ROLE;
  return MOTIF_COORDONNEES_ETAT;
}
