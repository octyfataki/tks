import { describe, expect, it } from "vitest";
import {
  availableCredit,
  creditLimitFor,
  decideCredit,
  type CreditPosition,
} from "@/modules/receivables/credit";

const position = (overrides: Partial<CreditPosition> = {}): CreditPosition => ({
  limit: 1000,
  receivables: 200,
  engaged: 100,
  ...overrides,
});

describe("disponible d'un profil", () => {
  it("retire les créances et l'engagé du plafond", () => {
    expect(availableCredit(position())).toBe(700);
  });

  it("ne descend jamais sous zéro", () => {
    expect(
      availableCredit({ limit: 100, receivables: 150, engaged: 10 }),
    ).toBe(0);
  });

  it("un plafond d'une autre devise vaut zéro dans la devise demandée", () => {
    expect(
      creditLimitFor({ plafondMontant: 500, plafondDevise: "USD" }, "CDF"),
    ).toBe(0);
    expect(
      creditLimitFor({ plafondMontant: 500, plafondDevise: "USD" }, "USD"),
    ).toBe(500);
  });
});

describe("décision de crédit", () => {
  it("une commande prépayée ne touche pas au plafond", () => {
    expect(
      decideCredit({
        type: "PREPAID",
        amount: 100_000,
        position: { limit: 0, receivables: 0, engaged: 0 },
      }),
    ).toEqual({ ok: true, available: 0 });
  });

  it("refuse le crédit quand le profil n'a aucun plafond", () => {
    const decision = decideCredit({
      type: "CREDIT",
      amount: 500,
      position: { limit: 0, receivables: 0, engaged: 0 },
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.reason).toBe("NO_LIMIT");
      expect(decision.available).toBe(0);
    }
  });

  it("accepte une commande qui tient exactement dans le disponible", () => {
    const decision = decideCredit({
      type: "CREDIT",
      amount: 700,
      position: position(),
    });
    expect(decision).toEqual({ ok: true, available: 700 });
  });

  it("refuse en disant ce qui manque", () => {
    const decision = decideCredit({
      type: "CREDIT",
      amount: 800,
      position: position(),
    });
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.reason).toBe("EXCEEDED");
      expect(decision.available).toBe(700);
      expect(decision.shortfall).toBe(100);
    }
  });

  it("l'engagé d'une commande en attente réduit le disponible", () => {
    const avant = decideCredit({
      type: "CREDIT",
      amount: 750,
      position: position({ engaged: 0 }),
    });
    const apres = decideCredit({
      type: "CREDIT",
      amount: 750,
      position: position({ engaged: 100 }),
    });
    expect(avant.ok).toBe(true);
    expect(apres.ok).toBe(false);
  });
});
