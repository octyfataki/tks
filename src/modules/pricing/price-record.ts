export const UNITS_PER_DOLLAR = 100;
export const AMOUNT_MAX = 4_294_967_295;

export const CLOSED_NETWORKS = [
  "ORANGE",
  "AIRTEL",
  "AFRICELL",
  "VODACOM",
] as const;

export type Network = (typeof CLOSED_NETWORKS)[number];

export const NETWORK_LABELS: Record<Network, string> = {
  ORANGE: "Orange",
  AIRTEL: "Airtel",
  AFRICELL: "Africell",
  VODACOM: "Vodacom",
};

export const CURRENCIES = ["USD", "CDF"] as const;

export type Currency = (typeof CURRENCIES)[number];

export type PriceGridErrorCode =
  | "NETWORK_UNKNOWN"
  | "CURRENCY_UNKNOWN"
  | "AMOUNT_INVALID"
  | "NOT_ALLOWED"
  | "AUDIT_UNAVAILABLE";

export class PriceGridError extends Error {
  code: PriceGridErrorCode;
  constructor(code: PriceGridErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type PriceLine = {
  id: string;
  network: string;
  amount: number;
  currency: string;
  effectiveAt: Date;
  enteredBy: string | null;
  deviceId: string | null;
};

export type PriceDraft = {
  network: string;
  amount: unknown;
  currency: string;
  effectiveAt?: Date;
  deviceId?: string | null;
};

export type PreparedPrice = {
  network: Network;
  amount: number;
  currency: Currency;
  effectiveAt: Date;
  deviceId: string | null;
};

export function isNetwork(value: string): value is Network {
  return (CLOSED_NETWORKS as readonly string[]).includes(value);
}

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function isValidAmount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= AMOUNT_MAX
  );
}

export function networkLabel(network: string): string {
  return isNetwork(network) ? NETWORK_LABELS[network] : network;
}

export const NETWORK_SLUGS: Record<Network, string> = {
  ORANGE: "orange",
  AIRTEL: "airtel",
  AFRICELL: "africell",
  VODACOM: "vodacom",
};

export function networkSlug(network: Network): string {
  return NETWORK_SLUGS[network];
}

export function networkFromSlug(slug: string): Network | null {
  return (
    CLOSED_NETWORKS.find((network) => NETWORK_SLUGS[network] === slug) ?? null
  );
}

export function readAmount(value: unknown): number {
  if (typeof value === "string") {
    return Number(value.replace(/[\s\u00a0\u202f]/g, ""));
  }
  return Number(value);
}

export function preparePrice(draft: PriceDraft): PreparedPrice {
  if (!isNetwork(draft.network)) {
    throw new PriceGridError("NETWORK_UNKNOWN", "Réseau inconnu.");
  }
  if (!isCurrency(draft.currency)) {
    throw new PriceGridError("CURRENCY_UNKNOWN", "Devise inconnue.");
  }
  const amount = readAmount(draft.amount);
  if (!isValidAmount(amount)) {
    throw new PriceGridError(
      "AMOUNT_INVALID",
      "Montant invalide : un entier, strictement positif, dans la devise choisie.",
    );
  }
  return {
    network: draft.network,
    amount,
    currency: draft.currency,
    effectiveAt: draft.effectiveAt ?? new Date(),
    deviceId: draft.deviceId ?? null,
  };
}

export function priceApplicable<
  T extends { network: string; effectiveAt: Date },
>(lines: readonly T[], network: string, instant: Date): T | null {
  let retained: T | null = null;
  const bound = instant.getTime();
  for (const line of lines) {
    if (line.network !== network) continue;
    if (line.effectiveAt.getTime() > bound) continue;
    if (
      retained === null ||
      line.effectiveAt.getTime() >= retained.effectiveAt.getTime()
    ) {
      retained = line;
    }
  }
  return retained;
}

export function amountForUnits(
  pricePerHundredUnits: number,
  units: number,
): number {
  return (units / UNITS_PER_DOLLAR) * pricePerHundredUnits;
}

export function unitsForAmount(
  pricePerHundredUnits: number,
  amount: number,
): number {
  return (amount / pricePerHundredUnits) * UNITS_PER_DOLLAR;
}

export function isBelowOfficialRate(
  price: { amount: number; currency: string },
  officialRateCdf: number | null,
): boolean {
  if (
    officialRateCdf === null ||
    !Number.isFinite(officialRateCdf) ||
    officialRateCdf <= 0
  ) {
    return false;
  }
  const amountInCdf =
    price.currency === "CDF" ? price.amount : price.amount * officialRateCdf;
  return amountInCdf < officialRateCdf;
}
