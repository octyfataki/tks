import { describe, expect, it } from "vitest";
import {
  dateDuJourKinshasa,
  jourValide,
  rolePeutSaisirTaux,
  valeurTauxValide,
} from "../db/schema/s3-devises/validation";

describe("dateDuJourKinshasa", () => {
  it("donne le jour civil AAAA-MM-JJ à Kinshasa (UTC+1)", () => {
    expect(
      dateDuJourKinshasa(new Date("2026-10-10T12:00:00Z")),
    ).toBe("2026-10-10");
  });

  it("bascule de jour à la minuit de Kinshasa, pas à celle de l'UTC", () => {
    expect(
      dateDuJourKinshasa(new Date("2026-10-10T23:30:00Z")),
    ).toBe("2026-10-11");
  });

  it("vaut la date du jour par défaut (aujourd'hui, sous ce fuseau)", () => {
    const attendu = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Kinshasa",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    expect(dateDuJourKinshasa()).toBe(attendu);
  });
});

describe("jourValide", () => {
  it("accepte un jour AAAA-MM-JJ réel", () => {
    expect(jourValide("2026-10-10")).toBe(true);
    expect(jourValide("2024-02-29")).toBe(true);
  });

  it("refuse un jour impossible ou mal formé", () => {
    expect(jourValide("2026-13-01")).toBe(false);
    expect(jourValide("2026-02-30")).toBe(false);
    expect(jourValide("2026-10-10T00:00:00")).toBe(false);
    expect(jourValide("dix")).toBe(false);
    expect(jourValide("")).toBe(false);
  });
});

describe("valeurTauxValide", () => {
  it("accepte un entier strictement positif dans INT UNSIGNED", () => {
    expect(valeurTauxValide(2300)).toBe(true);
    expect(valeurTauxValide(1)).toBe(true);
    expect(valeurTauxValide(4_294_967_295)).toBe(true);
  });

  it("refuse zéro, le négatif, la décimale et le hors-bande", () => {
    expect(valeurTauxValide(0)).toBe(false);
    expect(valeurTauxValide(-1)).toBe(false);
    expect(valeurTauxValide(2300.5)).toBe(false);
    expect(valeurTauxValide(4_294_967_296)).toBe(false);
  });

  it("refuse toute valeur non numérique", () => {
    expect(valeurTauxValide("2300")).toBe(false);
    expect(valeurTauxValide(null)).toBe(false);
    expect(valeurTauxValide(undefined)).toBe(false);
    expect(valeurTauxValide(Number.NaN)).toBe(false);
  });
});

describe("rolePeutSaisirTaux", () => {
  it("l'administrateur principal VALIDE saisit, le technique jamais", () => {
    expect(rolePeutSaisirTaux("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(rolePeutSaisirTaux("ADMIN_TECHNIQUE", "VALIDE")).toBe(false);
  });

  it("un compte non VALIDE ne saisit jamais", () => {
    expect(rolePeutSaisirTaux("ADMIN_PRINCIPAL", "SUSPENDU")).toBe(false);
    expect(rolePeutSaisirTaux("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
    expect(rolePeutSaisirTaux("AGENT", "SUSPENDU")).toBe(false);
  });

  it("l'agent VALIDE est indécis sans sa permission (null)", () => {
    expect(rolePeutSaisirTaux("AGENT", "VALIDE")).toBeNull();
  });

  it("un client ne saisit jamais", () => {
    expect(rolePeutSaisirTaux("CLIENT", "VALIDE")).toBe(false);
  });
});