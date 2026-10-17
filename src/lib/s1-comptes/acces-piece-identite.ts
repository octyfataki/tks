export type LecteurPiece =
  | { type: "ANONYME" }
  | { type: "CLIENT"; compteClientId: string }
  | { type: "STAFF"; role: string; etat: string; peutValider: boolean };

export type DecisionLecturePiece =
  | { autorise: true }
  | { autorise: false; statut: 401 | 403; erreur: string };

const REFS = {
  ANONYME: { statut: 401, erreur: "Non connecté." },
  AUTRE_CLIENT: { statut: 403, erreur: "Accès refusé." },
  STAFF_NON_VALIDE: { statut: 403, erreur: "Accès refusé." },
  SANS_PERMISSION: { statut: 403, erreur: "Accès refusé." },
} as const;

/**
 * Qui peut lire une pièce d'identité. Un client ne voit que la sienne ; un
 * membre du personnel doit être `VALIDE`, et un agent doit en plus avoir la
 * permission de valider. Un compte suspendu ou révoqué ne passe pas, même avec
 * la permission : la permission dit ce qu'on peut faire, pas qui est en
 * service.
 */
export function autoriseLecturePiece(
  lecteur: LecteurPiece,
  compteClientIdDeLaPiece: string,
): DecisionLecturePiece {
  if (lecteur.type === "ANONYME") {
    return { autorise: false, ...REFS.ANONYME };
  }

  if (lecteur.type === "CLIENT") {
    return lecteur.compteClientId === compteClientIdDeLaPiece
      ? { autorise: true }
      : { autorise: false, ...REFS.AUTRE_CLIENT };
  }

  if (lecteur.etat !== "VALIDE") {
    return { autorise: false, ...REFS.STAFF_NON_VALIDE };
  }

  if (lecteur.role === "AGENT") {
    return lecteur.peutValider
      ? { autorise: true }
      : { autorise: false, ...REFS.SANS_PERMISSION };
  }

  if (
    lecteur.role === "ADMIN_PRINCIPAL" ||
    lecteur.role === "ADMIN_TECHNIQUE"
  ) {
    return { autorise: true };
  }

  return { autorise: false, ...REFS.SANS_PERMISSION };
}