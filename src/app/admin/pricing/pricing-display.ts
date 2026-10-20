import { amountForUnits } from "@/modules/pricing/price-record";
import {
  NOMBRE,
  STAMP,
  amountLabel,
  equivalentLabel,
} from "@/modules/pricing/format";

export {
  DAY,
  NOMBRE,
  amountLabel,
  equivalentLabel,
  jourIso,
  officialRateOf,
} from "@/modules/pricing/format";
export type { OfficialRate } from "@/modules/pricing/format";

export const SAMPLE_UNITS = 1_000;

export type PriceEntry = {
  amount: number;
  currency: string;
  amountLabel: string;
  equivalentLabel: string | null;
  sampleLabel: string;
  effectiveAtLabel: string;
  authorLabel: string;
};

type PriceShown = {
  amount: number;
  currency: string;
  effectiveAt: Date;
  enteredByName: string | null;
};

export function toEntry(price: PriceShown, rateCdf: number | null): PriceEntry {
  return {
    amount: price.amount,
    currency: price.currency,
    amountLabel: amountLabel(price.amount, price.currency),
    equivalentLabel: equivalentLabel(price.amount, price.currency, rateCdf),
    sampleLabel: `${NOMBRE.format(
      amountForUnits(price.amount, SAMPLE_UNITS),
    )} ${price.currency}`,
    effectiveAtLabel: STAMP.format(price.effectiveAt),
    authorLabel: price.enteredByName ?? "compte inconnu",
  };
}
