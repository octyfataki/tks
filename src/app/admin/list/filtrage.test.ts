import { describe, expect, it } from "vitest";
import {
  filtrerLignes,
  trierLignes,
  type LigneFiltrable,
} from "./filtrage";

function ligne(partiel: Partial<LigneFiltrable> & { email: string }): LigneFiltrable {
  return {
    role: "ADMIN_PRINCIPAL",
    etat: "VALIDE",
    facteurActif: true,
    nom: null,
    telephone: null,
    createdAt: new Date("2026-10-01T10:00:00"),
    ...partiel,
  };
}

describe("filtrage de la liste des administrateurs", () => {
  const lignes = [
    ligne({ email: "alpha@exemple.cd", nom: "Alpha Dupont", role: "ADMIN_PRINCIPAL" }),
    ligne({
      email: "beta@exemple.cd",
      nom: "Beta Martin",
      role: "ADMIN_TECHNIQUE",
      etat: "REVOQUE",
      facteurActif: null,
      telephone: "+243 810 000 001",
      createdAt: new Date("2026-09-01T10:00:00"),
    }),
  ];

  it("filtre unique : un seul rôle, un seul état", () => {
    expect(filtrerLignes(lignes, "", "principal").map((l) => l.email)).toEqual([
      "alpha@exemple.cd",
    ]);
    expect(filtrerLignes(lignes, "", "technique").map((l) => l.email)).toEqual([
      "beta@exemple.cd",
    ]);
    expect(filtrerLignes(lignes, "", "valide")).toHaveLength(1);
    expect(filtrerLignes(lignes, "", "revoque").map((l) => l.email)).toEqual([
      "beta@exemple.cd",
    ]);
    expect(filtrerLignes(lignes, "", "sans-2fa").map((l) => l.email)).toEqual([
      "beta@exemple.cd",
    ]);
    expect(filtrerLignes(lignes, "", null)).toHaveLength(2);
  });

  it("recherche insensible à la casse sur nom, email, téléphone", () => {
    expect(filtrerLignes(lignes, "dupont", null).map((l) => l.email)).toEqual([
      "alpha@exemple.cd",
    ]);
    expect(filtrerLignes(lignes, "ALPHA", null)).toHaveLength(1);
    expect(filtrerLignes(lignes, "810 000 001", null).map((l) => l.email)).toEqual([
      "beta@exemple.cd",
    ]);
    expect(filtrerLignes(lignes, "inexistant", null)).toHaveLength(0);
  });

  it("tri : récents par défaut, anciens, noms FR, sans muter l'entrée", () => {
    const avant = lignes.map((l) => l.email);
    expect(trierLignes(lignes, null).map((l) => l.email)).toEqual([
      "alpha@exemple.cd",
      "beta@exemple.cd",
    ]);
    expect(trierLignes(lignes, "anciens").map((l) => l.email)).toEqual([
      "beta@exemple.cd",
      "alpha@exemple.cd",
    ]);
    expect(trierLignes(lignes, "nom-az").map((l) => l.email)).toEqual([
      "alpha@exemple.cd",
      "beta@exemple.cd",
    ]);
    expect(trierLignes(lignes, "nom-za").map((l) => l.email)).toEqual([
      "beta@exemple.cd",
      "alpha@exemple.cd",
    ]);
    expect(lignes.map((l) => l.email)).toEqual(avant);
  });
});
