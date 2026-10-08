import { describe, expect, it } from "vitest";
import {
  DEFAUT_DUREE_INVITATION_JOURS,
  estBootstrapTechniqueValide,
  estCleReglage,
  estEtatStaff,
  estRoleStaff,
  etatLienInvitation,
  normaliserDureeInvitationJours,
  peutChangerRole,
  peutCreerAdminPrincipal,
  peutInviterAdminPrincipal,
  peutInviterAgent,
  peutModifierAdmin,
  peutModifierReglage,
  peutRevoquerAdmin,
  peutSuspendreAdmin,
  peutLeverSuspension,
  roleCibleInvitationValide,
  telephoneStaffValide,
  transitionCompteStaffValide,
} from "../db/schema/s1-comptes/validation";

describe("règles staff", () => {
  it("rôles et états fermés", () => {
    expect(estRoleStaff("ADMIN_PRINCIPAL")).toBe(true);
    expect(estRoleStaff("CLIENT")).toBe(false);
    expect(estEtatStaff("VALIDE")).toBe(true);
    expect(estEtatStaff("SUSPENDU")).toBe(true);
    expect(estEtatStaff("REVOQUE")).toBe(true);
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

  it("invitation : seul le principal valide invite un agent ; cible AGENT ou ADMIN_PRINCIPAL", () => {
    expect(peutInviterAgent("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutInviterAgent("ADMIN_TECHNIQUE", "VALIDE")).toBe(false);
    expect(peutInviterAgent("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
    expect(roleCibleInvitationValide("AGENT")).toBe(true);
    // Écart assumé à S1-spec (lien admin demandé explicitement).
    expect(roleCibleInvitationValide("ADMIN_PRINCIPAL")).toBe(true);
    expect(roleCibleInvitationValide("ADMIN_TECHNIQUE")).toBe(false);
    expect(roleCibleInvitationValide("CLIENT")).toBe(false);
  });

  it("invitation admin : même autorisation que la création directe", () => {
    expect(peutInviterAdminPrincipal("ADMIN_TECHNIQUE", "VALIDE")).toBe(true);
    expect(peutInviterAdminPrincipal("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutInviterAdminPrincipal("AGENT", "VALIDE")).toBe(false);
    expect(peutInviterAdminPrincipal("ADMIN_TECHNIQUE", "REVOQUE")).toBe(false);
  });

  it("état d'un lien d'invitation : consommé > révoqué > expiré > en attente", () => {
    const maintenant = new Date("2026-06-01T12:00:00Z").getTime();
    const futur = new Date("2026-06-10T12:00:00Z");
    const passe = new Date("2026-05-20T12:00:00Z");
    expect(
      etatLienInvitation(
        { consommeLe: null, revoqueLe: null, expireLe: futur },
        maintenant,
      ),
    ).toBe("en-attente");
    expect(
      etatLienInvitation(
        { consommeLe: null, revoqueLe: null, expireLe: passe },
        maintenant,
      ),
    ).toBe("expire");
    // La décision humaine fait foi : révoqué reste révoqué après expiration.
    expect(
      etatLienInvitation(
        { consommeLe: null, revoqueLe: passe, expireLe: passe },
        maintenant,
      ),
    ).toBe("revoque");
    expect(
      etatLienInvitation(
        { consommeLe: passe, revoqueLe: null, expireLe: futur },
        maintenant,
      ),
    ).toBe("termine");
  });

  it("révocation admin : même autorisation que la création, définitive", () => {
    expect(peutRevoquerAdmin("ADMIN_TECHNIQUE", "VALIDE")).toBe(true);
    expect(peutRevoquerAdmin("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutRevoquerAdmin("AGENT", "VALIDE")).toBe(false);
    expect(peutRevoquerAdmin("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
    expect(peutRevoquerAdmin("ADMIN_PRINCIPAL", "SUSPENDU")).toBe(false);
  });

  it("suspension : même autorisation que la révocation, transitions fermées", () => {
    expect(peutSuspendreAdmin("ADMIN_TECHNIQUE", "VALIDE")).toBe(true);
    expect(peutSuspendreAdmin("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutSuspendreAdmin("AGENT", "VALIDE")).toBe(false);
    expect(peutSuspendreAdmin("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
    expect(peutSuspendreAdmin("ADMIN_PRINCIPAL", "SUSPENDU")).toBe(false);
    expect(peutLeverSuspension("ADMIN_TECHNIQUE", "VALIDE")).toBe(true);
    expect(peutLeverSuspension("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutLeverSuspension("AGENT", "VALIDE")).toBe(false);
    expect(peutLeverSuspension("ADMIN_PRINCIPAL", "SUSPENDU")).toBe(false);
    expect(transitionCompteStaffValide("VALIDE", "SUSPENDU")).toBe(true);
    expect(transitionCompteStaffValide("SUSPENDU", "VALIDE")).toBe(true);
    expect(transitionCompteStaffValide("VALIDE", "REVOQUE")).toBe(true);
    expect(transitionCompteStaffValide("SUSPENDU", "REVOQUE")).toBe(true);
    expect(transitionCompteStaffValide("REVOQUE", "VALIDE")).toBe(false);
    expect(transitionCompteStaffValide("REVOQUE", "SUSPENDU")).toBe(false);
    expect(transitionCompteStaffValide("VALIDE", "VALIDE")).toBe(false);
    expect(transitionCompteStaffValide("SUSPENDU", "SUSPENDU")).toBe(false);
  });

  it("correction admin (support) : même autorisation, jamais l'agent ni un révoqué", () => {
    expect(peutModifierAdmin("ADMIN_TECHNIQUE", "VALIDE")).toBe(true);
    expect(peutModifierAdmin("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutModifierAdmin("AGENT", "VALIDE")).toBe(false);
    expect(peutModifierAdmin("ADMIN_TECHNIQUE", "REVOQUE")).toBe(false);
  });

  it("réglages : clés fermées, durée bornée, même autorisation", () => {
    expect(estCleReglage("duree_invitation_jours")).toBe(true);
    expect(estCleReglage("taux_change")).toBe(false);
    expect(normaliserDureeInvitationJours(7)).toBe(7);
    expect(normaliserDureeInvitationJours("10")).toBe(10);
    expect(normaliserDureeInvitationJours(0)).toBe(1);
    expect(normaliserDureeInvitationJours(99)).toBe(30);
    expect(normaliserDureeInvitationJours("illisible")).toBe(
      DEFAUT_DUREE_INVITATION_JOURS,
    );
    expect(peutModifierReglage("ADMIN_TECHNIQUE", "VALIDE")).toBe(true);
    expect(peutModifierReglage("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutModifierReglage("AGENT", "VALIDE")).toBe(false);
    expect(peutModifierReglage("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
  });

  it("téléphone staff : optionnel, contact uniquement, jamais vérifié par SMS", () => {
    expect(telephoneStaffValide("")).toBe(true);
    expect(telephoneStaffValide("   ")).toBe(true);
    expect(telephoneStaffValide("+243 815 000 000")).toBe(true);
    expect(telephoneStaffValide("0815000000")).toBe(true);
    expect(telephoneStaffValide("+1-555-0100")).toBe(true);
    expect(telephoneStaffValide("abc")).toBe(false);
    expect(telephoneStaffValide("123")).toBe(false);
    expect(telephoneStaffValide("+243 815 000 000 000 000")).toBe(false);
  });
});
