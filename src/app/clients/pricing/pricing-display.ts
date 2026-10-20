import {
  STAMP,
  amountLabel,
  equivalentLabel,
} from "@/modules/pricing/format";
import type { ClientPriceLine } from "@/modules/pricing/read-client";

export type ClientPriceEntry = {
  amountLabel: string;
  equivalentLabel: string | null;
  effectiveAtLabel: string;
};

export function toClientEntry(
  price: ClientPriceLine,
  rateCdf: number | null,
): ClientPriceEntry {
  return {
    amountLabel: amountLabel(price.amount, price.currency),
    equivalentLabel: equivalentLabel(price.amount, price.currency, rateCdf),
    effectiveAtLabel: STAMP.format(price.effectiveAt),
  };
}
