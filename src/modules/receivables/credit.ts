import type { OrderType } from "@/modules/orders/order-record";

export type CreditPosition = {
  limit: number;
  receivables: number;
  engaged: number;
};

export type CreditDecision =
  | { ok: true; available: number }
  | { ok: false; available: number; shortfall: number; reason: "EXCEEDED" }
  | { ok: false; available: number; shortfall: number; reason: "NO_LIMIT" };

export function availableCredit(position: CreditPosition): number {
  const disponible =
    position.limit - position.receivables - position.engaged;
  return disponible > 0 ? disponible : 0;
}

export function creditLimitFor(
  profile: { plafondMontant: number; plafondDevise: string },
  currency: string,
): number {
  if (profile.plafondDevise !== currency) return 0;
  return profile.plafondMontant > 0 ? profile.plafondMontant : 0;
}

export function decideCredit(input: {
  type: OrderType;
  amount: number;
  position: CreditPosition;
}): CreditDecision {
  if (input.type === "PREPAID") {
    return { ok: true, available: availableCredit(input.position) };
  }
  const disponible = availableCredit(input.position);
  if (input.position.limit <= 0) {
    return {
      ok: false,
      available: 0,
      shortfall: input.amount,
      reason: "NO_LIMIT",
    };
  }
  if (input.amount > disponible) {
    return {
      ok: false,
      available: disponible,
      shortfall: input.amount - disponible,
      reason: "EXCEEDED",
    };
  }
  return { ok: true, available: disponible };
}
