import { describe, expect, it } from "vitest";
import {
  evaluerForceMotDePasse,
  validerChangementMotDePasse,
} from "./mot-de-passe-validation";

// Même exigence qu'à l'inscription : 8 caractères minimum, confirmation
// identique. Aucun appel réseau dans ces tests.
describe("validerChangementMotDePasse", () => {
  const valide = {
    actuel: "ancien-mot-de-passe",
    nouveau: "nouveau-mot-de-passe",
    confirmation: "nouveau-mot-de-passe",
  };

  it("accepte un changement bien formé", () => {
    expect(validerChangementMotDePasse(valide)).toBeNull();
  });

  it("exige le mot de passe actuel", () => {
    expect(
      validerChangementMotDePasse({ ...valide, actuel: "" }),
    ).toContain("actuel");
  });

  it("refuse un nouveau mot de passe trop court", () => {
    expect(
      validerChangementMotDePasse({
        ...valide,
        nouveau: "court",
        confirmation: "court",
      }),
    ).toContain("8 caractères");
  });

  it("refuse une confirmation différente", () => {
    expect(
      validerChangementMotDePasse({ ...valide, confirmation: "autre-mot-de-passe" }),
    ).toContain("confirmation");
  });

  it("refuse un nouveau mot de passe identique à l'actuel", () => {
    expect(
      validerChangementMotDePasse({
        actuel: "meme-mot-de-passe",
        nouveau: "meme-mot-de-passe",
        confirmation: "meme-mot-de-passe",
      }),
    ).toContain("différent");
  });
});

describe("evaluerForceMotDePasse", () => {
  it("juge trop court sous 8 caractères", () => {
    expect(evaluerForceMotDePasse("abc")).toEqual({
      niveau: 0,
      etiquette: "Trop court",
    });
    expect(evaluerForceMotDePasse("1234567").niveau).toBe(0);
  });

  it("monte avec la longueur et la variété", () => {
    expect(evaluerForceMotDePasse("huitcara").niveau).toBe(1);
    expect(evaluerForceMotDePasse("huitcaractere12").niveau).toBeGreaterThan(1);
    expect(evaluerForceMotDePasse("Comptoir-Kinshasa-2026!").niveau).toBe(4);
  });
});
