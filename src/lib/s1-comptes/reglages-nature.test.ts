import { describe, expect, it } from "vitest";
import {
  NATURE_REGLAGE,
  peutModifierReglage,
  peutModifierReglageNature,
} from "../db/schema/s1-comptes/validation";

// /admin/parametres — l'autorisation d'écriture est scindée par nature de
// réglage (S2 §Frontière : l'administrateur technique ne touche ni taux,
// ni plafond, ni promotion). Matrice pure, sans base.
describe("autorisation des réglages par nature", () => {
  it("la seule clé existante est technique", () => {
    expect(NATURE_REGLAGE).toEqual({ duree_invitation_jours: "TECHNIQUE" });
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
