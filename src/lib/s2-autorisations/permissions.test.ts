import { describe, expect, it } from "vitest";
import {
  estPermissionConnue,
  peutConsulterJournal,
  peutGererPermissions,
  PERMISSIONS_FERMEES,
  PROFIL_AGENT_SERVICE_DEFAUT,
} from "../db/schema/s2-autorisations/validation";

describe("S2 — liste fermée des permissions", () => {
  it("contient les 19 identifiants métier, et eux seuls", () => {
    expect(PERMISSIONS_FERMEES).toHaveLength(19);
    for (const nom of [
      "taux.saisir",
      "creance.creer",
      "paiement.creer",
      "ecriture.corriger",
      "tresorerie.mouvement",
      "plafond.modifier",
      "statut.modifier",
      "dossier.creer",
      "dossier.rattacher",
      "dossier.detacher",
      "grille.tarif",
      "preuve.valider",
      "commande.creer",
      "commande.prendre",
      "commande.servir",
      "commande.annuler",
      "reconciliation.trancher",
      "journal.consulter",
      "client.valider",
    ]) {
      expect(estPermissionConnue(nom)).toBe(true);
    }
  });

  it("un identifiant inventé vaut refus, pas permission implicite", () => {
    expect(estPermissionConnue("commande.teleporter")).toBe(false);
    expect(estPermissionConnue("")).toBe(false);
    expect(estPermissionConnue("ADMIN")).toBe(false);
  });

  it("seul un administrateur principal VALIDE gère les permissions", () => {
    expect(peutGererPermissions("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutGererPermissions("ADMIN_TECHNIQUE", "VALIDE")).toBe(false);
    expect(peutGererPermissions("AGENT", "VALIDE")).toBe(false);
    expect(peutGererPermissions("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
  });

  it("le profil agent est un sous-ensemble sans pouvoir sensible", () => {
    for (const permission of PROFIL_AGENT_SERVICE_DEFAUT) {
      expect(estPermissionConnue(permission)).toBe(true);
    }
    for (const sensible of [
      "taux.saisir",
      "plafond.modifier",
      "statut.modifier",
      "grille.tarif",
      "reconciliation.trancher",
      "journal.consulter",
    ]) {
      expect(PROFIL_AGENT_SERVICE_DEFAUT).not.toContain(sensible);
    }
  });

  it("journal lisible par les deux rôles admin valides, jamais par un révoqué", () => {
    expect(peutConsulterJournal("ADMIN_PRINCIPAL", "VALIDE")).toBe(true);
    expect(peutConsulterJournal("ADMIN_TECHNIQUE", "VALIDE")).toBe(true);
    expect(peutConsulterJournal("AGENT", "VALIDE")).toBe(false);
    expect(peutConsulterJournal("ADMIN_PRINCIPAL", "REVOQUE")).toBe(false);
  });
});
