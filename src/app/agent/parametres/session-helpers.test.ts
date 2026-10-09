import { describe, expect, it } from "vitest";
import {
  SEUIL_AVERTISSEMENT_JOURS,
  decrireExpiration,
} from "./session-helpers";

// S1 : expiration temporelle bornée, coupure réseau sans effet. On vérifie
// l'affichage de l'échéance et le seuil d'avertissement (story 19).
describe("decrireExpiration", () => {
  const maintenant = new Date("2026-10-01T08:00:00Z");

  it("annonce une expiration lointaine sans avertissement", () => {
    const description = decrireExpiration(
      new Date("2026-10-06T08:00:00Z"),
      maintenant,
    );
    expect(description.joursRestants).toBe(5);
    expect(description.expiree).toBe(false);
    expect(description.expireBientot).toBe(false);
    expect(description.dateFormatee).not.toBe("Inconnue");
  });

  it("avertit quand il reste 2 jours ou moins", () => {
    expect(
      decrireExpiration(new Date("2026-10-03T08:00:00Z"), maintenant)
        .expireBientot,
    ).toBe(true);
    expect(
      decrireExpiration(new Date("2026-10-02T08:00:00Z"), maintenant)
        .expireBientot,
    ).toBe(true);
    expect(SEUIL_AVERTISSEMENT_JOURS).toBe(2);
  });

  it("signale une session expirée", () => {
    const description = decrireExpiration(
      new Date("2026-09-30T08:00:00Z"),
      maintenant,
    );
    expect(description.expiree).toBe(true);
    expect(description.joursRestants).toBe(0);
    expect(description.expireBientot).toBe(false);
  });

  it("replie sur « Inconnue » quand l'expiration est illisible", () => {
    for (const valeur of [null, undefined, "pas-une-date"]) {
      const description = decrireExpiration(
        valeur as unknown as string,
        maintenant,
      );
      expect(description.dateFormatee).toBe("Inconnue");
      expect(description.joursRestants).toBeNull();
      expect(description.expiree).toBe(false);
    }
  });
});
