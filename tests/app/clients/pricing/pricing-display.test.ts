import { describe, expect, it } from "vitest";
import { toClientEntry } from "@/app/clients/pricing/pricing-display";
import type { ClientPriceLine } from "@/modules/pricing/read-client";

const prix: ClientPriceLine = {
  network: "ORANGE",
  amount: 2350,
  currency: "CDF",
  effectiveAt: new Date("2026-10-19T08:12:00.000Z"),
};

describe("affichage client des tarifs", () => {
  it("affiche le prix natif et l'équivalent au taux du jour", () => {
    const entree = toClientEntry(prix, 2300);
    expect(entree.amountLabel).toBe("2\u202f350 CDF");
    expect(entree.equivalentLabel).toBe("≈ 1,02 USD");
  });

  it("convertit un prix en dollars vers le franc", () => {
    const entree = toClientEntry(
      { ...prix, amount: 1, currency: "USD" },
      2300,
    );
    expect(entree.amountLabel).toBe("1 USD");
    expect(entree.equivalentLabel).toBe("≈ 2\u202f300 CDF");
  });

  it("masque l'équivalent quand le taux manque", () => {
    const entree = toClientEntry(prix, null);
    expect(entree.equivalentLabel).toBeNull();
  });

  it("ne transporte aucun nom d'auteur", () => {
    const entree = toClientEntry(prix, 2300);
    expect(Object.keys(entree).sort()).toEqual([
      "amountLabel",
      "effectiveAtLabel",
      "equivalentLabel",
    ]);
  });
});
