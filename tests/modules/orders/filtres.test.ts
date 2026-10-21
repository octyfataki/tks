import { describe, expect, it } from "vitest";
import {
  filtreCommandes,
  filtresActifs,
  filtresVides,
  normaliserFiltres,
  trieCommandes,
} from "@/modules/orders/filtres";
import type { OrderView } from "@/modules/orders/read";

function commande(overrides: Partial<OrderView> = {}): OrderView {
  return {
    id: "cmd-1",
    profileId: "profil-1",
    profileName: "Blaise Mbala",
    profilePhone: "0852599623",
    network: "ORANGE",
    channel: "COUNTER",
    type: "PREPAID",
    units: 1000,
    amount: 23000,
    currency: "CDF",
    pricePerHundred: 2300,
    state: "QUEUED",
    lockedBy: null,
    lockedByName: null,
    lockedAt: null,
    lockExpired: false,
    proofId: null,
    refusalReason: null,
    createdAt: new Date("2026-10-20T09:00:00.000Z"),
    ...overrides,
  };
}

describe("normalisation des filtres", () => {
  it("rejette les valeurs hors liste", () => {
    const filtres = normaliserFiltres({
      q: "  Blaise  ",
      etat: "INCONNU",
      reseau: "MTN",
      type: "LOAN",
      periode: "ans",
      tri: "hasard",
    });
    expect(filtres).toEqual({
      q: "Blaise",
      etat: "",
      reseau: "",
      type: "",
      periode: "",
      tri: "",
    });
  });

  it("garde les valeurs connues", () => {
    const filtres = normaliserFiltres({
      etat: "LOCKED",
      reseau: "ORANGE",
      type: "CREDIT",
      periode: "7j",
      tri: "montant",
    });
    expect(filtres.etat).toBe("LOCKED");
    expect(filtres.reseau).toBe("ORANGE");
    expect(filtres.type).toBe("CREDIT");
    expect(filtres.periode).toBe("7j");
    expect(filtres.tri).toBe("montant");
    expect(filtresActifs(filtres)).toBe(true);
  });

  it("ne compte aucun filtre vide comme actif", () => {
    expect(filtresActifs(filtresVides())).toBe(false);
  });
});

describe("filtrage des commandes", () => {
  const aujourdhui = new Date("2026-10-20T12:00:00.000Z");
  const commandes = [
    commande(),
    commande({
      id: "cmd-2",
      profileName: "Josiane Kalala",
      profilePhone: "0812345678",
      network: "AIRTEL",
      type: "CREDIT",
      state: "SERVED",
      amount: 11500,
      createdAt: new Date("2026-10-19T08:00:00.000Z"),
    }),
    commande({
      id: "cmd-3",
      profileName: "Blaise Mbala",
      profilePhone: "0852599623",
      network: "VODACOM",
      state: "AWAITING_PROOF",
      amount: 5750,
      createdAt: new Date("2026-10-20T07:30:00.000Z"),
    }),
  ];

  it("filtre par état", () => {
    const resultat = filtreCommandes(
      commandes,
      { ...filtresVides(), etat: "SERVED" },
      aujourdhui,
    );
    expect(resultat.map((ligne) => ligne.id)).toEqual(["cmd-2"]);
  });

  it("filtre par réseau et par type de paiement", () => {
    expect(
      filtreCommandes(
        commandes,
        { ...filtresVides(), reseau: "VODACOM" },
        aujourdhui,
      ).map((ligne) => ligne.id),
    ).toEqual(["cmd-3"]);
    expect(
      filtreCommandes(
        commandes,
        { ...filtresVides(), type: "CREDIT" },
        aujourdhui,
      ).map((ligne) => ligne.id),
    ).toEqual(["cmd-2"]);
  });

  it("cherche le client par nom ou par téléphone", () => {
    expect(
      filtreCommandes(
        commandes,
        { ...filtresVides(), q: "josiane" },
        aujourdhui,
      ).map((ligne) => ligne.id),
    ).toEqual(["cmd-2"]);
    expect(
      filtreCommandes(
        commandes,
        { ...filtresVides(), q: "0812 345 678" },
        aujourdhui,
      ).map((ligne) => ligne.id),
    ).toEqual(["cmd-2"]);
  });

  it("filtre sur la période", () => {
    expect(
      filtreCommandes(
        commandes,
        { ...filtresVides(), periode: "jour" },
        aujourdhui,
      ).map((ligne) => ligne.id),
    ).toEqual(["cmd-1", "cmd-3"]);
    expect(
      filtreCommandes(commandes, { ...filtresVides(), periode: "7j" }, aujourdhui),
    ).toHaveLength(3);
  });

  it("cumule les filtres", () => {
    const resultat = filtreCommandes(
      commandes,
      { ...filtresVides(), q: "blaise", etat: "AWAITING_PROOF" },
      aujourdhui,
    );
    expect(resultat.map((ligne) => ligne.id)).toEqual(["cmd-3"]);
  });

  it("ne renvoie rien quand rien ne correspond", () => {
    expect(
      filtreCommandes(commandes, { ...filtresVides(), q: "personne" }, aujourdhui),
    ).toEqual([]);
  });
});

describe("tri des commandes", () => {
  const commandes = [
    commande({
      id: "cmd-vieux",
      amount: 100,
      createdAt: new Date("2026-10-10T08:00:00.000Z"),
    }),
    commande({
      id: "cmd-recent",
      amount: 900,
      createdAt: new Date("2026-10-20T08:00:00.000Z"),
    }),
    commande({
      id: "cmd-moyen",
      amount: 500,
      createdAt: new Date("2026-10-15T08:00:00.000Z"),
    }),
  ];

  it("trie par défaut sur les plus récentes", () => {
    expect(trieCommandes(commandes, "").map((ligne) => ligne.id)).toEqual([
      "cmd-recent",
      "cmd-moyen",
      "cmd-vieux",
    ]);
  });

  it("trie sur les plus anciennes", () => {
    expect(trieCommandes(commandes, "anciens").map((ligne) => ligne.id)).toEqual([
      "cmd-vieux",
      "cmd-moyen",
      "cmd-recent",
    ]);
  });

  it("trie sur le montant décroissant", () => {
    expect(trieCommandes(commandes, "montant").map((ligne) => ligne.id)).toEqual([
      "cmd-recent",
      "cmd-moyen",
      "cmd-vieux",
    ]);
  });

  it("ne modifie pas la liste d'origine", () => {
    const avant = commandes.map((ligne) => ligne.id);
    trieCommandes(commandes, "montant");
    expect(commandes.map((ligne) => ligne.id)).toEqual(avant);
  });
});
