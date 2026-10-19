import { describe, expect, it } from "vitest";
import {
  CLOSED_NETWORKS,
  NETWORK_SLUGS,
  PriceGridError,
  UNITS_PER_DOLLAR,
  amountForUnits,
  isBelowOfficialRate,
  isValidAmount,
  networkFromSlug,
  networkSlug,
  preparePrice,
  priceApplicable,
  unitsForAmount,
  type PriceLine,
} from "@/modules/pricing/price-record";

function ligneAu(iso: string, amount: number): PriceLine {
  return {
    id: `prix-${iso}`,
    network: "ORANGE",
    amount,
    currency: "CDF",
    effectiveAt: new Date(iso),
    enteredBy: "staff-1",
    deviceId: null,
  };
}

function code(execution: () => unknown): string {
  try {
    execution();
  } catch (erreur) {
    if (erreur instanceof PriceGridError) return erreur.code;
    throw erreur;
  }
  throw new Error("aucune erreur levée");
}

describe("S5-01 — la grille tarifaire, côté domaine", () => {
  it("ne connaît que les réseaux de la liste fermée", () => {
    expect(CLOSED_NETWORKS).toEqual([
      "ORANGE",
      "AIRTEL",
      "AFRICELL",
      "VODACOM",
    ]);
    expect(
      code(() =>
        preparePrice({ network: "MTN", amount: 2350, currency: "CDF" }),
      ),
    ).toBe("NETWORK_UNKNOWN");
  });

  it("nomme chaque réseau et lui donne un chemin stable", () => {
    expect(NETWORK_SLUGS).toEqual({
      ORANGE: "orange",
      AIRTEL: "airtel",
      AFRICELL: "africell",
      VODACOM: "vodacom",
    });
    for (const network of CLOSED_NETWORKS) {
      expect(networkFromSlug(networkSlug(network))).toBe(network);
    }
    expect(networkFromSlug("other")).toBeNull();
    expect(networkFromSlug("ORANGE")).toBeNull();
  });

  it("tient le prix d'un dollar d'airtime, en cent unités", () => {
    expect(UNITS_PER_DOLLAR).toBe(100);
    expect(amountForUnits(2350, 100)).toBe(2350);
    expect(amountForUnits(2350, 10)).toBe(235);
    expect(amountForUnits(2350, 1000)).toBe(23500);
    expect(unitsForAmount(2350, 23500)).toBe(1000);
  });

  it("n'accepte qu'un entier strictement positif comme montant", () => {
    expect(isValidAmount(2350)).toBe(true);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(2350.5)).toBe(false);
    expect(isValidAmount("2350")).toBe(false);
    expect(
      preparePrice({ network: "ORANGE", amount: "2 350", currency: "CDF" })
        .amount,
    ).toBe(2350);
    expect(
      code(() =>
        preparePrice({
          network: "ORANGE",
          amount: "deux mille",
          currency: "CDF",
        }),
      ),
    ).toBe("AMOUNT_INVALID");
  });

  it("garde la devise du prix, sans conversion implicite", () => {
    expect(
      code(() =>
        preparePrice({ network: "ORANGE", amount: 1, currency: "EUR" }),
      ),
    ).toBe("CURRENCY_UNKNOWN");
    expect(
      preparePrice({ network: "ORANGE", amount: 1, currency: "USD" }).currency,
    ).toBe("USD");
  });

  it("date la prise d'effet au moment de la saisie", () => {
    const avant = Date.now();
    const prepare = preparePrice({
      network: "AIRTEL",
      amount: 2500,
      currency: "CDF",
    });
    expect(prepare.effectiveAt.getTime()).toBeGreaterThanOrEqual(avant);
    expect(prepare.deviceId).toBeNull();
  });

  it("applique, à un instant, la dernière ligne datée qui le précède", () => {
    const lignes = [
      ligneAu("2026-10-01T08:00:00.000Z", 2300),
      ligneAu("2026-10-05T08:00:00.000Z", 2350),
      ligneAu("2026-10-10T08:00:00.000Z", 2400),
    ];
    expect(
      priceApplicable(lignes, "ORANGE", new Date("2026-10-03T00:00:00.000Z"))
        ?.amount,
    ).toBe(2300);
    expect(
      priceApplicable(lignes, "ORANGE", new Date("2026-10-05T08:00:00.000Z"))
        ?.amount,
    ).toBe(2350);
    expect(
      priceApplicable(lignes, "ORANGE", new Date("2026-10-31T23:59:59.000Z"))
        ?.amount,
    ).toBe(2400);
    expect(
      priceApplicable(lignes, "ORANGE", new Date("2026-09-30T23:59:59.000Z")),
    ).toBeNull();
  });

  it("ne laisse pas un prix futur s'appliquer avant son heure", () => {
    const lignes = [ligneAu("2026-10-10T08:00:00.000Z", 2400)];
    expect(
      priceApplicable(lignes, "ORANGE", new Date("2026-10-10T07:59:59.999Z")),
    ).toBeNull();
  });

  it("ne répond jamais pour un réseau qui n'a pas de ligne", () => {
    const lignes = [ligneAu("2026-10-01T08:00:00.000Z", 2300)];
    expect(
      priceApplicable(lignes, "AIRTEL", new Date("2026-10-02T08:00:00.000Z")),
    ).toBeNull();
  });

  it("signale un prix sous le taux du jour, et rien de plus", () => {
    expect(isBelowOfficialRate({ amount: 2000, currency: "CDF" }, 2350)).toBe(
      true,
    );
    expect(isBelowOfficialRate({ amount: 2350, currency: "CDF" }, 2350)).toBe(
      false,
    );
    expect(isBelowOfficialRate({ amount: 0.9, currency: "USD" }, 2350)).toBe(
      true,
    );
    expect(isBelowOfficialRate({ amount: 1, currency: "USD" }, 2350)).toBe(
      false,
    );
    expect(isBelowOfficialRate({ amount: 2000, currency: "CDF" }, null)).toBe(
      false,
    );
  });
});
