export const NOMBRE = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

export const STAMP = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Kinshasa",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const DAY = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Kinshasa",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export type OfficialRate = {
  value: number;
  label: string;
};

export function amountLabel(amount: number, currency: string): string {
  return `${NOMBRE.format(amount)} ${currency}`;
}

export function equivalentLabel(
  amount: number,
  currency: string,
  rateCdf: number | null,
): string | null {
  if (rateCdf === null || rateCdf <= 0) {
    return null;
  }
  const converted = currency === "CDF" ? amount / rateCdf : amount * rateCdf;
  const target = currency === "CDF" ? "USD" : "CDF";
  return `≈ ${NOMBRE.format(converted)} ${target}`;
}

const JOUR_ISO = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Kinshasa",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function jourIso(instant: Date): string {
  return JOUR_ISO.format(instant);
}

export function officialRateOf(
  taux: { valeur: number; jour: string } | null,
): OfficialRate | null {
  if (taux === null) {
    return null;
  }
  return {
    value: taux.valeur,
    label: DAY.format(new Date(`${taux.jour}T12:00:00.000Z`)),
  };
}
