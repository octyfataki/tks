import { describe, expect, it } from "vitest";
import {
  deciderCommandeCredit,
  expositionDansDevise,
  plafondRestant,
} from "./credit";

const base = {
  plafondMontant: 200,
  plafondDevise: "USD" as const,
  expositions: [{ devise: "USD", montant: 120 }],
};

describe("S4 — plafond de crédit", () => {
  it("déduit le plafond des créances de la même devise", () => {
    expect(plafondRestant(base)).toBe(80);
  });

  it("n'additionne ni ne convertit les autres devises", () => {
    const expositions = [
      { devise: "USD", montant: 120 },
      { devise: "CDF", montant: 5_000_000 },
    ];
    expect(expositionDansDevise(expositions, "USD")).toBe(120);
    expect(plafondRestant({ ...base, expositions })).toBe(80);
  });

  it("ne laisse pas une créance en CDF consommer un plafond en USD", () => {
    const restant = plafondRestant({
      plafondMontant: 200,
      plafondDevise: "USD",
      expositions: [
        { devise: "USD", montant: 120 },
        { devise: "CDF", montant: 10_000_000 },
      ],
    });
    expect(restant).toBe(80);
  });
});

describe("S4 — décision de commande", () => {
  it("laisse un client privilégié commander dans son disponible", () => {
    const decision = deciderCommandeCredit({
      ...base,
      statut: "PRIVILEGIE",
      typeCommande: "CREDIT",
      montantCommande: 80,
      deviseCommande: "USD",
    });
    expect(decision).toEqual({ autorise: true, plafondRestant: 0, devise: "USD" });
  });

  it("refuse un centime de trop, et dit combien il reste", () => {
    const decision = deciderCommandeCredit({
      ...base,
      statut: "PRIVILEGIE",
      typeCommande: "CREDIT",
      montantCommande: 81,
      deviseCommande: "USD",
    });
    expect(decision).toMatchObject({
      autorise: false,
      code: "PLAFOND_DEPASSE",
    });
  });

  it("force un client en évaluation à prépayer", () => {
    const decision = deciderCommandeCredit({
      ...base,
      statut: "EN_EVALUATION",
      typeCommande: "CREDIT",
      montantCommande: 10,
      deviseCommande: "USD",
    });
    expect(decision).toMatchObject({
      autorise: false,
      code: "STATUT_INSUFFISANT",
    });
  });

  it("laisse un client en évaluation commander en prépayé, même plafond atteint", () => {
    const decision = deciderCommandeCredit({
      ...base,
      statut: "EN_EVALUATION",
      typeCommande: "PREPAYE",
      montantCommande: 999,
      deviseCommande: "CDF",
      expositions: [{ devise: "USD", montant: 200 }],
    });
    expect(decision.autorise).toBe(true);
  });

  it("ne compare jamais un plafond USD à une commande en CDF", () => {
    const decision = deciderCommandeCredit({
      ...base,
      statut: "PRIVILEGIE",
      typeCommande: "CREDIT",
      montantCommande: 10,
      deviseCommande: "CDF",
    });
    expect(decision).toMatchObject({
      autorise: false,
      code: "DEVISE_INCOHERENTE",
    });
  });

  it("signale un plafond déjà dépassé au lieu d'en autoriser un nouveau", () => {
    const decision = deciderCommandeCredit({
      ...base,
      expositions: [{ devise: "USD", montant: 200 }],
      statut: "PRIVILEGIE",
      typeCommande: "CREDIT",
      montantCommande: 1,
      deviseCommande: "USD",
    });
    expect(decision).toMatchObject({
      autorise: false,
      code: "PLAFOND_DEJA_DEPASSE",
    });
  });
});