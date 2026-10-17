export type DescriptionExpiration = {
  dateFormatee: string;
  joursRestants: number | null;
  expiree: boolean;
  expireBientot: boolean;
};

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
