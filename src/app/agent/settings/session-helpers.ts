export type SessionExpiration = {
  formattedDate: string;
  daysRemaining: number | null;
  isExpired: boolean;
  expiresSoon: boolean;
};

export const EXPIRY_WARNING_THRESHOLD_DAYS = 2;

export function describeSessionExpiration(
  expiration: Date | string | null | undefined,
  now: Date = new Date(),
): SessionExpiration {
  if (!expiration) {
    return {
      formattedDate: "Inconnue",
      daysRemaining: null,
      isExpired: false,
      expiresSoon: false,
    };
  }
  const date = expiration instanceof Date ? expiration : new Date(expiration);
  if (Number.isNaN(date.getTime())) {
    return {
      formattedDate: "Inconnue",
      daysRemaining: null,
      isExpired: false,
      expiresSoon: false,
    };
  }
  const daysRemaining = Math.floor(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isExpired = date.getTime() <= now.getTime();
  return {
    formattedDate: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date),
    daysRemaining: isExpired ? 0 : daysRemaining,
    isExpired,
    expiresSoon:
      !isExpired && daysRemaining <= EXPIRY_WARNING_THRESHOLD_DAYS,
  };
}