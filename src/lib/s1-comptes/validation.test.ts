import { describe, expect, it } from "vitest";
import {
  estBootstrapTechniqueValide,
  estEtatStaff,
  estRoleStaff,
  peutChangerRole,
  peutCreerAdminPrincipal,
  peutInviterAgent,
  roleCibleInvitationValide,
} from "../db/schema/s1-comptes/validation";

describe("règles staff", () => {
  it("rôles et états fermés", () => {
    expect(estRoleStaff("ADMIN_PRINCIPAL")).toBe(true);
    expect(estRoleStaff("CLIENT")).toBe(false);
    expect(estEtatStaff("VALIDE")).toBe(true);
    expect(estEtatStaff("EN_ATTENTE_VALIDATION")).toBe(false);
  });

  it("rôle immuable", () => {
    expect(peutChangerRole()).toBe(false);
  });

  it("bootstrap : premier compte = ADMIN_TECHNIQUE sans créateur", () => {
    expect(estBootstrapTechniqueValide("ADMIN_TECHNIQUE", null, 0)).toBe(true);
    expect(estBootstrapTechniqueValide("ADMIN_PRINCIPAL", null, 0)).toBe(false);
    expect(estBootstrapTechniqueValide("ADMIN_TECHNIQUE", "quelqu-un", 0)).toBe(
      false,
    );
    expect(estBootstrapTechniqueValide("ADMIN_TECHNIQUE", null, 1)).toBe(false);
  });

  it("principal créé par technique ou principal valide", () => {
    expect(peutCreerAdminPrincipal("ADMIN_TECHNIQUE", "VALIDE")).toBe(true);
    expect(peutCreerAdminPrincipal("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutCreerAdminPrincipal("AGENT", "VALIDE")).toBe(false);
    expect(peutCreerAdminPrincipal("ADMIN_TECHNIQUE", "REVOQUE")).toBe(false);
  });

  it("invitation : seul le principal valide invite, cible AGENT", () => {
    expect(peutInviterAgent("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutInviterAgent("ADMIN_TECHNIQUE", "VALIDE")).toBe(false);
    expect(peutInviterAgent("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
    expect(roleCibleInvitationValide("AGENT")).toBe(true);
    expect(roleCibleInvitationValide("ADMIN_PRINCIPAL")).toBe(false);
  });
});
