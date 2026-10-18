import { describe, expect, it } from "vitest";
import { correctivesPour } from "@/lib/authorizations/contestation";

describe("S2 — correctives proposées depuis le journal", () => {
  it("propose la révocation du compte pour une validation", () => {
    const resultat = correctivesPour({
      typeAction: "client.valider",
      statut: "REUSSIE",
    });
    expect(resultat.contestable).toBe(true);
    if (resultat.contestable) {
      expect(resultat.correctives.map((c) => c.cle)).toEqual([
        "client.revoquer",
      ]);
    }
  });

  it("propose le retrait pour une permission accordée", () => {
    const resultat = correctivesPour({
      typeAction: "permission.accorder",
      statut: "REUSSIE",
    });
    expect(resultat.contestable).toBe(true);
    if (resultat.contestable) {
      expect(resultat.correctives.map((c) => c.cle)).toEqual([
        "permission.retirer",
      ]);
    }
  });

  it("propose suspendre et révoquer pour une création d'agent", () => {
    const resultat = correctivesPour({
      typeAction: "agent.creer",
      statut: "REUSSIE",
    });
    expect(resultat.contestable).toBe(true);
    if (resultat.contestable) {
      expect(resultat.correctives.map((c) => c.cle)).toEqual([
        "agent.suspendre",
        "agent.revoquer",
      ]);
    }
  });

  it("explique sans bouton pour un taux (jamais écrasé)", () => {
    const resultat = correctivesPour({
      typeAction: "taux.saisir",
      statut: "REUSSIE",
    });
    expect(resultat.contestable).toBe(false);
    if (!resultat.contestable) {
      expect(resultat.explication).toContain("ajustement");
    }
  });

  it("explique sans bouton pour un profil (retrait une par une)", () => {
    const resultat = correctivesPour({
      typeAction: "permission.profil",
      statut: "REUSSIE",
    });
    expect(resultat.contestable).toBe(false);
  });

  it("explique sans bouton pour une étiquette (retrait depuis la fiche)", () => {
    for (const typeAction of ["annotation.poser", "annotation.retirer"]) {
      const resultat = correctivesPour({ typeAction, statut: "REUSSIE" });
      expect(resultat.contestable).toBe(false);
      if (!resultat.contestable) {
        expect(resultat.explication).toContain("fiche");
      }
    }
  });

  it("ne conteste jamais une action échouée", () => {
    const resultat = correctivesPour({
      typeAction: "client.valider",
      statut: "ECHOUEE",
    });
    expect(resultat.contestable).toBe(false);
  });

  it("ne propose rien d'inventé pour une action inconnue", () => {
    const resultat = correctivesPour({
      typeAction: "inconnu.xyz",
      statut: "REUSSIE",
    });
    expect(resultat.contestable).toBe(false);
  });
});
