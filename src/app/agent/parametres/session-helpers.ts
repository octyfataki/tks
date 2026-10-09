/**
 * Helpers purs de la section Session (/agent/parametres).
 *
 * S1 : la session de l'agent de service survit à la coupure réseau mais
 * expire quand même (durée bornée, quelques jours — voir `session.expiresIn`
 * dans `src/lib/auth.ts`). L'agent voit sa date d'expiration en permanence
 * et reçoit un avertissement avant l'échéance (story 19).
 *
 * Tout est testable sans base ni réseau : on injecte `maintenant`.
 */

export type DescriptionExpiration = {
  /** Date d'expiration formatée pour l'affichage, ou texte de repli. */
  dateFormatee: string;
  /** Jours restants arrondis vers le bas. Nul quand l'expiration est inconnue. */
  joursRestants: number | null;
  /** Vrai quand l'expiration est passée. */
  expiree: boolean;
  /** Vrai quand il reste 2 jours ou moins : moment de se reconnecter. */
  expireBientot: boolean;
};

/** Seuil d'avertissement avant échéance : 48 h (S1 story 19). */
export const SEUIL_AVERTISSEMENT_JOURS = 2;

export function decrireExpiration(
  expiration: Date | string | null | undefined,
  maintenant: Date = new Date(),
): DescriptionExpiration {
  if (!expiration) {
    return {
      dateFormatee: "Inconnue",
      joursRestants: null,
      expiree: false,
      expireBientot: false,
    };
  }
  const date = expiration instanceof Date ? expiration : new Date(expiration);
  if (Number.isNaN(date.getTime())) {
    return {
      dateFormatee: "Inconnue",
      joursRestants: null,
      expiree: false,
      expireBientot: false,
    };
  }
  const joursRestants = Math.floor(
    (date.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24),
  );
  const expiree = date.getTime() <= maintenant.getTime();
  return {
    dateFormatee: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date),
    joursRestants: expiree ? 0 : joursRestants,
    expiree,
    expireBientot:
      !expiree && joursRestants <= SEUIL_AVERTISSEMENT_JOURS,
  };
}
