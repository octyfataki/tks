import { describe, expect, it } from "vitest";
import {
  MOTIF_COORDONNEES_ETAT,
  MOTIF_COORDONNEES_ROLE,
  motifCoordonneesVerrouillees,
  peutModifierSesCoordonnees,
} from "@/lib/accounts/compte-profil";

describe("peutModifierSesCoordonnees", () => {
  it("laisse modifier un administrateur principal valide", () => {
    expect(peutModifierSesCoordonnees("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
  });

  it("laisse modifier un agent de service valide", () => {
    expect(peutModifierSesCoordonnees("AGENT", "VALIDE")).toBe(true);
  });

  it("interdit à l'administrateur technique", () => {
    expect(peutModifierSesCoordonnees("ADMIN_TECHNIQUE", "VALIDE")).toBe(false);
  });

  it("interdit tout compte non valide", () => {
    expect(peutModifierSesCoordonnees("ADMIN_PRINCIPAL", "SUSPENDU")).toBe(false);
    expect(peutModifierSesCoordonnees("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
    expect(peutModifierSesCoordonnees("AGENT", "SUSPENDU")).toBe(false);
  });
});

describe("motifCoordonneesVerrouillees", () => {
  it("désigne le rôle de l'administrateur technique", () => {
    expect(motifCoordonneesVerrouillees("ADMIN_TECHNIQUE", "VALIDE")).toBe(
      MOTIF_COORDONNEES_ROLE,
    );
    expect(MOTIF_COORDONNEES_ROLE).toContain("administrateur technique");
  });

  it("désigne l'état du compte pour les autres rôles", () => {
    expect(motifCoordonneesVerrouillees("ADMIN_PRINCIPAL", "SUSPENDU")).toBe(
      MOTIF_COORDONNEES_ETAT,
    );
  });
});
