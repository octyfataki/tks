import { describe, expect, it } from "vitest";
import {
  estEtatClient,
  ETATS_CLIENT,
  normaliserTelephoneClient,
  telephoneClientValide,
  transitionCompteClientValide,
} from "../db/schema/s1-comptes/validation";

describe("états du compte client", () => {
  it("états fermés : les quatre du GLOSSARY, rien d'autre", () => {
    expect([...ETATS_CLIENT]).toEqual([
      "EN_ATTENTE_VALIDATION",
      "VALIDE",
      "REFUSE",
      "REVOQUE",
    ]);
    expect(estEtatClient("EN_ATTENTE_VALIDATION")).toBe(true);
    expect(estEtatClient("VALIDE")).toBe(true);
    expect(estEtatClient("REFUSE")).toBe(true);
    expect(estEtatClient("REVOQUE")).toBe(true);
    expect(estEtatClient("VALIDE ")).toBe(false);
    expect(estEtatClient("SUSPENDU")).toBe(false);
    expect(estEtatClient("")).toBe(false);
  });

  it("l'inscription part en attente : seul EN_ATTENTE naît", () => {
    // Garde-fou de lecture : le défaut base est EN_ATTENTE_VALIDATION
    // (voir comptes-clients.ts), et la couche clients le pose explicitement.
    expect(estEtatClient("EN_ATTENTE_VALIDATION")).toBe(true);
  });

  it("transitions : attente vers valide/refusé/révoqué, refusé revalidable", () => {
    expect(transitionCompteClientValide("EN_ATTENTE_VALIDATION", "VALIDE")).toBe(
      true,
    );
    expect(transitionCompteClientValide("EN_ATTENTE_VALIDATION", "REFUSE")).toBe(
      true,
    );
    expect(transitionCompteClientValide("EN_ATTENTE_VALIDATION", "REVOQUE")).toBe(
      true,
    );
    expect(transitionCompteClientValide("REFUSE", "VALIDE")).toBe(true);
    expect(transitionCompteClientValide("REFUSE", "REVOQUE")).toBe(true);
    expect(transitionCompteClientValide("VALIDE", "REVOQUE")).toBe(true);
  });

  it("transitions interdites : révoqué terminal, jamais de retour en attente", () => {
    expect(transitionCompteClientValide("REVOQUE", "VALIDE")).toBe(false);
    expect(transitionCompteClientValide("REVOQUE", "REFUSE")).toBe(false);
    expect(
      transitionCompteClientValide("REVOQUE", "EN_ATTENTE_VALIDATION"),
    ).toBe(false);
    expect(transitionCompteClientValide("VALIDE", "EN_ATTENTE_VALIDATION")).toBe(
      false,
    );
    expect(transitionCompteClientValide("VALIDE", "REFUSE")).toBe(false);
    expect(transitionCompteClientValide("REFUSE", "EN_ATTENTE_VALIDATION")).toBe(
      false,
    );
    expect(
      transitionCompteClientValide("EN_ATTENTE_VALIDATION", "EN_ATTENTE_VALIDATION"),
    ).toBe(false);
  });
});

describe("téléphone du compte client", () => {
  it("obligatoire : clé métier du compte, un compte sans téléphone est refusé", () => {
    expect(telephoneClientValide("")).toBe(false);
    expect(telephoneClientValide("   ")).toBe(false);
  });

  it("format souple, comme le staff", () => {
    expect(telephoneClientValide("+243 815 000 000")).toBe(true);
    expect(telephoneClientValide("0815000000")).toBe(true);
    expect(telephoneClientValide("abc")).toBe(false);
    expect(telephoneClientValide("123")).toBe(false);
  });

  it("normalisation canonique : deux écritures du même numéro sont le même compte", () => {
    // La forme stockée et comparée ne contient que des chiffres (+ initial
    // optionnel) : l'unicité ne se contourne pas par des espaces.
    expect(normaliserTelephoneClient("+243 815 000 000")).toBe("+243815000000");
    expect(normaliserTelephoneClient("+243-815-000-000")).toBe("+243815000000");
    expect(normaliserTelephoneClient("+243 (815) 000 000")).toBe("+243815000000");
    expect(normaliserTelephoneClient("00243815000000")).toBe("+243815000000");
    expect(normaliserTelephoneClient("0815000000")).toBe("0815000000");
    expect(normaliserTelephoneClient("")).toBeNull();
    expect(normaliserTelephoneClient("   ")).toBeNull();
    expect(normaliserTelephoneClient("abc")).toBeNull();
    expect(normaliserTelephoneClient("123")).toBeNull();
  });
});
