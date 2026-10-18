import { describe, expect, it } from "vitest";
import {
  NATURE_REGLAGE,
  peutModifierReglage,
  peutModifierReglageNature,
} from "../db/schema/s1-comptes/validation";

describe("autorisation des réglages par nature", () => {
  it("décrit chaque clé, et le plafond par défaut est un réglage métier", () => {
    expect(NATURE_REGLAGE).toEqual({
      duree_invitation_jours: "TECHNIQUE",
      plafond_client_defaut_montant: "METIER",
      plafond_client_defaut_devise: "METIER",
    });
  });

  it("le plafond par défaut échappe à l'administrateur technique", () => {
    expect(
      peutModifierReglage(
        "plafond_client_defaut_montant",
        "ADMIN_PRINCIPAL",
        "VALIDE",
      ),
    ).toBe(true);
    expect(
      peutModifierReglage(
        "plafond_client_defaut_montant",
        "ADMIN_TECHNIQUE",
        "VALIDE",
      ),
    ).toBe(false);
    expect(
      peutModifierReglage("plafond_client_defaut_devise", "AGENT", "VALIDE"),
    ).toBe(false);
  });

  it("réglage technique : les deux administrateurs VALIDE modifient", () => {
    expect(
      peutModifierReglageNature("TECHNIQUE", "ADMIN_PRINCIPAL", "VALIDE"),
    ).toBe(true);
    expect(
      peutModifierReglageNature("TECHNIQUE", "ADMIN_TECHNIQUE", "VALIDE"),
    ).toBe(true);
  });

  it("réglage métier : seul l'administrateur principal VALIDE modifie", () => {
    expect(
      peutModifierReglageNature("METIER", "ADMIN_PRINCIPAL", "VALIDE"),
    ).toBe(true);
    expect(
      peutModifierReglageNature("METIER", "ADMIN_TECHNIQUE", "VALIDE"),
    ).toBe(false);
  });

  it("ni l'agent ni un compte non VALIDE ne modifient, quelle que soit la nature", () => {
    for (const nature of ["TECHNIQUE", "METIER"] as const) {
      expect(peutModifierReglageNature(nature, "AGENT", "VALIDE")).toBe(false);
      expect(
        peutModifierReglageNature(nature, "ADMIN_PRINCIPAL", "REVOQUE"),
      ).toBe(false);
      expect(
        peutModifierReglageNature(nature, "ADMIN_PRINCIPAL", "SUSPENDU"),
      ).toBe(false);
      expect(
        peutModifierReglageNature(nature, "ADMIN_TECHNIQUE", "SUSPENDU"),
      ).toBe(false);
    }
  });

  it("par clé : la durée d'invitation suit la règle technique, l'inconnu est refusé", () => {
    expect(
      peutModifierReglage(
        "duree_invitation_jours",
        "ADMIN_TECHNIQUE",
        "VALIDE",
      ),
    ).toBe(true);
    expect(
      peutModifierReglage("duree_invitation_jours", "AGENT", "VALIDE"),
    ).toBe(false);
    expect(
      peutModifierReglage("plafond_defaut", "ADMIN_PRINCIPAL", "VALIDE"),
    ).toBe(false);
  });
});
