import { describe, expect, it } from "vitest";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  CATEGORIES,
  CATEGORY_DIRECTIONS,
  CATEGORY_LABELS,
  CashError,
  MOVEMENT_DIRECTIONS,
  MOVEMENT_KINDS,
  SOURCE_KINDS,
  calculeFluxTotaux,
  compteLabel,
  prepareAccount,
  prepareMovement,
  prepareTransfer,
  sensCorrection,
  soldeOf,
  type CashCategory,
  type MovementDirection,
} from "@/modules/treasury/cash-record";

function code(execution: () => unknown): string {
  try {
    execution();
  } catch (erreur) {
    if (erreur instanceof CashError) return erreur.code;
    throw erreur;
  }
  throw new Error("aucune erreur levée");
}

function instant(iso: string): Date {
  return new Date(iso);
}

function mouvement(
  direction: MovementDirection,
  category: CashCategory,
  amount: number,
  iso: string,
) {
  return { direction, amount, category, occurredAt: instant(iso) };
}

describe("S7 — le vocabulaire de la trésorerie est une liste fermée", () => {
  it("porte deux types de comptes, six catégories, deux sens, deux natures, deux sources", () => {
    expect(ACCOUNT_TYPES).toEqual(["CASH", "ELECTRONIC_MONEY"]);
    expect(CATEGORIES).toEqual([
      "SALE",
      "BANK_WITHDRAWAL",
      "OPERATOR_TOPUP",
      "REPAYMENT",
      "TRANSFER",
      "OWNER_WITHDRAWAL",
    ]);
    expect(MOVEMENT_DIRECTIONS).toEqual(["IN", "OUT"]);
    expect(MOVEMENT_KINDS).toEqual(["OPERATION", "CORRECTION"]);
    expect(SOURCE_KINDS).toEqual(["MANUAL", "AUTOMATIC"]);
    expect(CATEGORY_LABELS.SALE).toBe("Vente");
    expect(ACCOUNT_TYPE_LABELS.CASH).toBe("Caisse");
  });

  it("fixe le sens de chaque catégorie : une vente entre, tout le reste sort sauf le transfert", () => {
    expect(CATEGORY_DIRECTIONS.SALE).toEqual(["IN"]);
    expect(CATEGORY_DIRECTIONS.BANK_WITHDRAWAL).toEqual(["OUT"]);
    expect(CATEGORY_DIRECTIONS.OPERATOR_TOPUP).toEqual(["OUT"]);
    expect(CATEGORY_DIRECTIONS.REPAYMENT).toEqual(["OUT"]);
    expect(CATEGORY_DIRECTIONS.OWNER_WITHDRAWAL).toEqual(["OUT"]);
    expect(CATEGORY_DIRECTIONS.TRANSFER).toEqual(["IN", "OUT"]);
  });
});

describe("S7 — le solde d'un compte est la somme algébrique de ses mouvements", () => {
  const ouverture = {
    openingAmount: 100_000,
    openedAt: instant("2026-10-01T08:00:00Z"),
  };

  it("intègre une sortie : ce que le prototype ne permettait pas", () => {
    const total = soldeOf(ouverture, [
      mouvement("IN", "SALE", 5_000, "2026-10-02T10:00:00Z"),
      mouvement("OUT", "OPERATOR_TOPUP", 12_000, "2026-10-03T09:00:00Z"),
    ]);
    expect(total).toBe(93_000);
  });

  it("ne compte rien avant l'ouverture du compte", () => {
    const apresOuverture = soldeOf(
      ouverture,
      [mouvement("IN", "SALE", 5_000, "2026-10-01T09:00:00Z")],
      instant("2026-10-01T10:00:00Z"),
    );
    const avantOuverture = soldeOf(
      ouverture,
      [mouvement("IN", "SALE", 5_000, "2026-09-30T10:00:00Z")],
      instant("2026-09-30T11:00:00Z"),
    );
    expect(apresOuverture).toBe(105_000);
    expect(avantOuverture).toBe(0);
  });

  it("comptabilise la même chose à une date de rapprochement passée", () => {
    const auRepere = soldeOf(
      ouverture,
      [
        mouvement("IN", "SALE", 5_000, "2026-10-02T10:00:00Z"),
        mouvement("OUT", "BANK_WITHDRAWAL", 50_000, "2026-10-04T09:00:00Z"),
      ],
      instant("2026-10-03T00:00:00Z"),
    );
    expect(auRepere).toBe(105_000);
  });
});

describe("S7 — catégories et sens sont contrôlés à la préparation", () => {
  const compte = { currency: "USD" };

  it("refuse une catégorie inconnue et un sens inconnu", () => {
    expect(
      code(() =>
        prepareMovement(
          {
            accountId: "compte-1",
            direction: "IN",
            category: "FRAIS",
            amount: 100,
            currency: "USD",
          },
          compte,
        ),
      ),
    ).toBe("CATEGORY_REQUIRED");
    expect(
      code(() =>
        prepareMovement(
          {
            accountId: "compte-1",
            direction: "STONKS",
            category: "SALE",
            amount: 100,
            currency: "USD",
          },
          compte,
        ),
      ),
    ).toBe("CATEGORY_REQUIRED");
  });

  it("refuse une recharge opérateur en entrée et une vente en sortie", () => {
    expect(
      code(() =>
        prepareMovement(
          {
            accountId: "compte-1",
            direction: "IN",
            category: "OPERATOR_TOPUP",
            amount: 100,
            currency: "USD",
          },
          compte,
        ),
      ),
    ).toBe("CATEGORY_DIRECTION_INVALID");
    expect(
      code(() =>
        prepareMovement(
          {
            accountId: "compte-1",
            direction: "OUT",
            category: "SALE",
            amount: 100,
            currency: "USD",
          },
          compte,
        ),
      ),
    ).toBe("CATEGORY_DIRECTION_INVALID");
  });

  it("refuse FRAIS et COMMISSION : elles n'existent pas", () => {
    for (const categorie of ["FRAIS", "COMMISSION"]) {
      expect(
        code(() =>
          prepareMovement(
            {
              accountId: "compte-1",
              direction: "OUT",
              category: categorie,
              amount: 100,
              currency: "USD",
            },
            compte,
          ),
        ),
        categorie,
      ).toBe("CATEGORY_REQUIRED");
    }
  });

  it("refuse un mouvement saisi de catégorie TRANSFER : il passe par le transfert", () => {
    expect(
      code(() =>
        prepareMovement(
          {
            accountId: "compte-1",
            direction: "IN",
            category: "TRANSFER",
            amount: 100,
            currency: "USD",
          },
          compte,
        ),
      ),
    ).toBe("TRANSFER_NOT_MANUAL");
  });

  it("refuse un montant nul, négatif, non entier ou hors devise du compte", () => {
    expect(
      code(() =>
        prepareMovement(
          {
            accountId: "compte-1",
            direction: "IN",
            category: "SALE",
            amount: 0,
            currency: "USD",
          },
          compte,
        ),
      ),
    ).toBe("AMOUNT_INVALID");
    expect(
      code(() =>
        prepareMovement(
          {
            accountId: "compte-1",
            direction: "IN",
            category: "SALE",
            amount: 10.5,
            currency: "USD",
          },
          compte,
        ),
      ),
    ).toBe("AMOUNT_INVALID");
    expect(
      code(() =>
        prepareMovement(
          {
            accountId: "compte-1",
            direction: "IN",
            category: "SALE",
            amount: 100,
            currency: "CDF",
          },
          { currency: "USD" },
        ),
      ),
    ).toBe("CURRENCY_MISMATCH");
  });

  it("conserve la description et accepte le flux légitime", () => {
    const prepare = prepareMovement(
      {
        accountId: "compte-1",
        direction: "OUT",
        category: "REPAYMENT",
        amount: " 2 500 ",
        currency: "USD",
        description: "  Remboursement du client Boutique Sol  ",
      },
      { currency: "USD" },
    );
    expect(prepare).toMatchObject({
      direction: "OUT",
      category: "REPAYMENT",
      amount: 2_500,
      description: "Remboursement du client Boutique Sol",
    });
  });
});

describe("S7 — un transfert relie deux comptes différents, dans une devise unique", () => {
  it("refuse le même compte, une devise inconnue, un montant invalide", () => {
    expect(
      code(() =>
        prepareTransfer({
          fromAccountId: "a",
          toAccountId: "a",
          amount: 100,
          currency: "USD",
        }),
      ),
    ).toBe("TRANSFER_SAME_ACCOUNT");
    expect(
      code(() =>
        prepareTransfer({
          fromAccountId: "a",
          toAccountId: "b",
          amount: 100,
          currency: "EUR",
        }),
      ),
    ).toBe("CURRENCY_UNKNOWN");
    expect(
      code(() =>
        prepareTransfer({
          fromAccountId: "a",
          toAccountId: "b",
          amount: -5,
          currency: "USD",
        }),
      ),
    ).toBe("AMOUNT_INVALID");
  });

  it("prépare la paire : sortie du départ, entrée dans l'arrivée", () => {
    const prepare = prepareTransfer({
      fromAccountId: "a",
      toAccountId: "b",
      amount: 2_000,
      currency: "USD",
    });
    expect(prepare).toMatchObject({
      fromAccountId: "a",
      toAccountId: "b",
      amount: 2_000,
      currency: "USD",
    });
  });
});

describe("S7 — ouverture de compte", () => {
  it("exige un solde d'ouverture entier, zéro admis", () => {
    expect(
      code(() =>
        prepareAccount({
          type: "CASH",
          network: "",
          currency: "USD",
          openingAmount: -1,
        }),
      ),
    ).toBe("OPENING_INVALID");
    expect(
      code(() =>
        prepareAccount({
          type: "CASH",
          network: "",
          currency: "USD",
          openingAmount: 1.5,
        }),
      ),
    ).toBe("OPENING_INVALID");
    const ouvertureNulle = prepareAccount({
      type: "CASH",
      network: "",
      currency: "CDF",
      openingAmount: 0,
    });
    expect(ouvertureNulle.openingAmount).toBe(0);
  });

  it("refuse la caisse avec un réseau et la monnaie électronique sans réseau connu", () => {
    expect(
      code(() =>
        prepareAccount({
          type: "CASH",
          network: "ORANGE",
          currency: "USD",
          openingAmount: 0,
        }),
      ),
    ).toBe("NETWORK_UNKNOWN");
    expect(
      code(() =>
        prepareAccount({
          type: "ELECTRONIC_MONEY",
          network: "MPESA",
          currency: "USD",
          openingAmount: 0,
        }),
      ),
    ).toBe("NETWORK_UNKNOWN");
  });

  it("nomme les comptes : la caisse s'appelle Caisse, le compte porte son réseau", () => {
    expect(compteLabel({ type: "CASH", network: "" })).toBe("Caisse");
    expect(compteLabel({ type: "ELECTRONIC_MONEY", network: "ORANGE" })).toBe(
      "Orange",
    );
  });
});

describe("S7 — les totaux de flux neutralisent les transferts", () => {
  it("ignore TRANSFER dans les recettes et les dépenses", () => {
    const totaux = calculeFluxTotaux([
      mouvement("IN", "SALE", 5_000, "2026-10-02T10:00:00Z"),
      mouvement("OUT", "TRANSFER", 2_000, "2026-10-02T11:00:00Z"),
      mouvement("IN", "TRANSFER", 2_000, "2026-10-02T11:01:00Z"),
      mouvement("OUT", "OWNER_WITHDRAWAL", 1_000, "2026-10-02T12:00:00Z"),
      mouvement("OUT", "SALE", 3_000, "2026-10-02T13:00:00Z"),
    ]);
    expect(totaux.entrees).toBe(5_000);
    expect(totaux.sorties).toBe(4_000);
    expect(totaux.parCategorie.get("TRANSFER")).toBeUndefined();
    expect(totaux.parCategorie.get("SALE")).toEqual({
      entrees: 5_000,
      sorties: 3_000,
    });
    expect(totaux.parCategorie.get("OWNER_WITHDRAWAL")).toEqual({
      entrees: 0,
      sorties: 1_000,
    });
  });

  it(" Ignore les catégories illisibles plutôt que de les cumuler", () => {
    const totaux = calculeFluxTotaux([
      { direction: "IN", amount: 999, category: "MYSTERE" },
    ]);
    expect(totaux.entrees).toBe(0);
    expect(totaux.sorties).toBe(0);
    expect(totaux.parCategorie.size).toBe(0);
  });
});

describe("S7 — une correction porte l'écriture inverse", () => {
  it("inverse le sens d'origine et refuse un sens illisible", () => {
    expect(sensCorrection("IN")).toBe("OUT");
    expect(sensCorrection("OUT")).toBe("IN");
    expect(code(() => sensCorrection("SIDEWAYS"))).toBe(
      "CORRECTION_IMPOSSIBLE",
    );
  });
});
