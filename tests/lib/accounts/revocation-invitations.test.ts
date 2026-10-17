import { describe, expect, it } from "vitest";
import {
  etatLienInvitation,
  peutInviterAdminPrincipal,
  peutInviterAgent,
  verdictRevocationLien,
} from "@/lib/db/schema/accounts/validation";

describe("révocation d'un lien d'invitation (issue #1)", () => {
  const maintenant = new Date("2026-06-01T12:00:00Z").getTime();
  const futur = new Date("2026-06-10T12:00:00Z");
  const passe = new Date("2026-05-20T12:00:00Z");

  it("un lien en attente est à révoquer, et affiché en attente", () => {
    const lien = { consommeLe: null, revoqueLe: null, expireLe: futur };
    expect(verdictRevocationLien(lien, maintenant)).toBe("A_REVOQUER");
    expect(etatLienInvitation(lien, maintenant)).toBe("en-attente");
  });

  it("révocation invalide l'acceptation : un lien révoqué est refusé même avant expiration", () => {
    const lien = { consommeLe: null, revoqueLe: passe, expireLe: futur };
    expect(etatLienInvitation(lien, maintenant)).toBe("revoque");
    expect(verdictRevocationLien(lien, maintenant)).toBe("DEJA_REVOQUE");
  });

  it("double révocation idempotente : déjà révoqué = même état, pas d'erreur", () => {
    const lien = { consommeLe: null, revoqueLe: passe, expireLe: futur };
    expect(verdictRevocationLien(lien, maintenant)).toBe("DEJA_REVOQUE");
    const apresExpiration = {
      consommeLe: null,
      revoqueLe: passe,
      expireLe: passe,
    };
    expect(etatLienInvitation(apresExpiration, maintenant)).toBe("revoque");
    expect(verdictRevocationLien(apresExpiration, maintenant)).toBe(
      "DEJA_REVOQUE",
    );
  });

  it("lien consommé ou expiré non révoquable, avec motif distinct", () => {
    expect(
      verdictRevocationLien(
        { consommeLe: passe, revoqueLe: null, expireLe: futur },
        maintenant,
      ),
    ).toBe("DEJA_CONSOMME");
    expect(
      etatLienInvitation(
        { consommeLe: passe, revoqueLe: null, expireLe: futur },
        maintenant,
      ),
    ).toBe("termine");
    expect(
      verdictRevocationLien(
        { consommeLe: null, revoqueLe: null, expireLe: passe },
        maintenant,
      ),
    ).toBe("EXPIRE");
    expect(
      etatLienInvitation(
        { consommeLe: null, revoqueLe: null, expireLe: passe },
        maintenant,
      ),
    ).toBe("expire");
  });

  it("non-autorisé refusé : seuls technique et principal valides révoquent un lien administrateur", () => {
    expect(peutInviterAdminPrincipal("ADMIN_TECHNIQUE", "VALIDE")).toBe(true);
    expect(peutInviterAdminPrincipal("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutInviterAdminPrincipal("AGENT", "VALIDE")).toBe(false);
    expect(peutInviterAdminPrincipal("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
    expect(peutInviterAdminPrincipal("ADMIN_TECHNIQUE", "REVOQUE")).toBe(false);
  });

  it("voie agent inchangée : seul le principal valide révoque un lien agent", () => {
    expect(peutInviterAgent("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutInviterAgent("ADMIN_TECHNIQUE", "VALIDE")).toBe(false);
    expect(peutInviterAgent("AGENT", "VALIDE")).toBe(false);
  });
});
