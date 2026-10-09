import { describe, expect, it } from "vitest";
import { destinationAide } from "@/lib/aide-content";
import type { Profil } from "@/lib/s1-comptes/role-session";

/**
 * Le répartiteur /aide envoie chaque type d'utilisateur connecté sur l'aide
 * de son niveau — jamais en accès libre, jamais sur un autre niveau.
 */
describe("destinationAide", () => {
  it("envoie l'anonyme et l'inconnu à la connexion", () => {
    expect(destinationAide({ type: "ANONYME" })).toBe("/sign-in");
    expect(destinationAide({ type: "INCONNU" })).toBe("/sign-in");
  });

  it("envoie le client sur l'aide client", () => {
    const profil: Profil = { type: "CLIENT", etat: "VALIDE" };
    expect(destinationAide(profil)).toBe("/clients/aide");
  });

  it("envoie l'agent validé sur l'aide agent", () => {
    const profil: Profil = { type: "STAFF", role: "AGENT", etat: "VALIDE" };
    expect(destinationAide(profil)).toBe("/agent/aide");
  });

  it("envoie chaque administrateur validé sur l'aide admin", () => {
    expect(
      destinationAide({ type: "STAFF", role: "ADMIN_PRINCIPAL", etat: "VALIDE" }),
    ).toBe("/admin/aide");
    expect(
      destinationAide({ type: "STAFF", role: "ADMIN_TECHNIQUE", etat: "VALIDE" }),
    ).toBe("/admin/aide");
  });

  it("renvoie le staff non validé à la connexion", () => {
    expect(
      destinationAide({ type: "STAFF", role: "AGENT", etat: "REVOQUE" }),
    ).toBe("/sign-in");
  });
});
