import { describe, expect, it } from "vitest";
import {
  nomEntite,
  resumerEvenement,
} from "@/lib/authorizations/journal-summary";

describe("S2 — résumé lisible du journal", () => {
  it("formule le taux saisi avec jour et valeur", () => {
    expect(
      resumerEvenement({
        typeAction: "taux.saisir",
        entite: "taux_change",
        apres: { jour: "2026-10-11", valeur: 2800 },
      }),
    ).toBe("Taux du 2026-10-11 : 2\u202f800 CDF pour 1 USD");
  });

  it("accepte l'après en JSON brut tel que lu en base", () => {
    expect(
      resumerEvenement({
        typeAction: "taux.saisir",
        entite: "taux_change",
        apres: JSON.stringify({ jour: "2026-10-11", valeur: 2800 }),
      }),
    ).toContain("2\u202f800 CDF");
  });

  it("formule la validation avec transition d'état", () => {
    expect(
      resumerEvenement({
        typeAction: "client.valider",
        entite: "compte_client",
        avant: { etat: "EN_ATTENTE_VALIDATION" },
        apres: { etat: "VALIDE", vuAuComptoir: true, typePiece: "CNI" },
      }),
    ).toBe(
      "Validation du compte client (EN_ATTENTE_VALIDATION → VALIDE au comptoir, pièce CNI vue)",
    );
  });

  it("formule le refus avec son motif", () => {
    expect(
      resumerEvenement({
        typeAction: "client.refuser",
        entite: "compte_client",
        avant: { etat: "EN_ATTENTE_VALIDATION" },
        apres: { etat: "REFUSE" },
        motif: "Photo illisible",
      }),
    ).toContain("motif : Photo illisible");
  });

  it("nomme l'agent concerné par la permission quand son nom est connu", () => {
    const noms = new Map([["agent-1", "Aline"]]);
    expect(
      resumerEvenement(
        {
          typeAction: "permission.accorder",
          entite: "permission",
          apres: { agentId: "agent-1", permission: "taux.saisir" },
        },
        noms,
      ),
    ).toBe("Permission taux.saisir accordée à l'agent Aline");
  });

  it("retombe sur l'UUID sans inventer de nom inconnu", () => {
    expect(
      resumerEvenement({
        typeAction: "permission.accorder",
        entite: "permission",
        apres: { agentId: "agent-9", permission: "taux.saisir" },
      }),
    ).toBe("Permission taux.saisir accordée à l'agent agent-9");
  });

  it("rend null pour une action inconnue (retombée code brut)", () => {
    expect(
      resumerEvenement({ typeAction: "inconnu.xyz", entite: "x" }),
    ).toBeNull();
  });

  it("libelle les entités sans jargon de table", () => {
    expect(nomEntite("compte_client")).toBe("Compte client");
    expect(nomEntite("taux_change")).toBe("Taux");
    expect(nomEntite("annotation_client")).toBe("Annotation client");
  });

  it("formule la pose d'étiquette avec le libellé figé dans la trace", () => {
    const noms = new Map([["client-1", "Marie"]]);
    expect(
      resumerEvenement(
        {
          typeAction: "annotation.poser",
          entite: "annotation_client",
          apres: {
            compteClientId: "client-1",
            etiquette: "BON_PAYEUR",
            libelle: "Bon payeur",
          },
        },
        noms,
      ),
    ).toBe("Étiquette « Bon payeur » posée sur le compte Marie");
  });

  it("formule le retrait d'étiquette sans inventer de nom", () => {
    expect(
      resumerEvenement({
        typeAction: "annotation.retirer",
        entite: "annotation_client",
        apres: {
          compteClientId: "client-9",
          etiquette: "A_SURVEILLER",
          libelle: "À surveiller",
        },
      }),
    ).toBe("Étiquette « À surveiller » retirée du compte client-9");
  });

  it("retombe sur le code brut pour une trace sans libellé", () => {
    expect(
      resumerEvenement({
        typeAction: "annotation.poser",
        entite: "annotation_client",
        apres: { compteClientId: "client-1", etiquette: "BON_PAYEUR" },
      }),
    ).toContain("BON_PAYEUR");
  });

  it("formule la prise en main et garde l'ancien code de verrouillage lisible", () => {
    const prise = {
      typeAction: "order.claim",
      entite: "order",
      apres: { state: "QUEUED" },
    } as const;
    expect(resumerEvenement(prise)).toBe("Commande verrouillée");
    expect(
      resumerEvenement({
        ...prise,
        avant: { state: "QUEUED" },
        apres: { state: "LOCKED" },
      }),
    ).toBe("Commande verrouillée (QUEUED → LOCKED)");
    expect(resumerEvenement({ ...prise, typeAction: "order.lock" })).toBe(
      "Commande verrouillée",
    );
  });

  it("formule le refus de crédit avec le montant manquant", () => {
    expect(
      resumerEvenement({
        typeAction: "order.credit_refuse",
        entite: "profil_client",
        apres: { amount: 500, currency: "USD", reason: "EXCEEDED", disponible: 300, manque: 200 },
      }),
    ).toBe("Crédit refusé : il manque 200 USD");
  });

  it("nomme les entités commande et profil client", () => {
    expect(nomEntite("order")).toBe("Commande");
    expect(nomEntite("profil_client")).toBe("Profil client");
  });
});
