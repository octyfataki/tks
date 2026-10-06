import { describe, expect, it } from "vitest";
import {
  accesTemporaireUtilisable,
  DUREE_MAX_ACCES_TEMPORAIRE_MS,
  ouvertureAccesTemporaireValide,
  peutRemplacerFacteur2fa,
  roleExigeSecondFacteur,
} from "../db/schema/s1-comptes/validation";

describe("complément staff : 2FA, pièces, accès temporaires", () => {
  it("second facteur réservé aux deux admins", () => {
    expect(roleExigeSecondFacteur("ADMIN_PRINCIPAL")).toBe(true);
    expect(roleExigeSecondFacteur("ADMIN_TECHNIQUE")).toBe(true);
    expect(roleExigeSecondFacteur("AGENT")).toBe(false);
  });

  it("remplacement initié par un principal valide, sans bypass", () => {
    expect(peutRemplacerFacteur2fa("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutRemplacerFacteur2fa("ADMIN_TECHNIQUE", "VALIDE")).toBe(false);
    expect(peutRemplacerFacteur2fa("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
  });

  it("ouverture exige pièce vue et durée courte", () => {
    const maintenant = Date.now();
    expect(
      ouvertureAccesTemporaireValide("piece-1", new Date(maintenant + 3_600_000), maintenant),
    ).toBe(true);
    expect(
      ouvertureAccesTemporaireValide(null, new Date(maintenant + 3_600_000), maintenant),
    ).toBe(false);
    expect(
      ouvertureAccesTemporaireValide(
        "piece-1",
        new Date(maintenant + DUREE_MAX_ACCES_TEMPORAIRE_MS + 1),
        maintenant,
      ),
    ).toBe(false);
    expect(
      ouvertureAccesTemporaireValide("piece-1", new Date(maintenant - 1), maintenant),
    ).toBe(false);
  });

  it("accès utilisable : ni consommé ni expiré", () => {
    const maintenant = Date.now();
    expect(accesTemporaireUtilisable(null, new Date(maintenant + 1_000), maintenant)).toBe(true);
    expect(accesTemporaireUtilisable(new Date(), new Date(maintenant + 1_000), maintenant)).toBe(
      false,
    );
    expect(accesTemporaireUtilisable(null, new Date(maintenant - 1_000), maintenant)).toBe(false);
  });
});
