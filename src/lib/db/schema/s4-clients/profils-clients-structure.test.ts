import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// S4-T1 (issue #34) — test structurel de la table des profils clients :
// le client métier est la boutique, le compte n'est qu'un moyen d'accès
// (spec S4 refondue, issue #32). Échoue dès que la migration ajoute une
// contrainte d'unicité sur le nom ou le contact, un dérivé stocké, ou perd
// un index — exactement le jour où la promesse cesserait d'être vraie.
describe("S4 — les profils clients portent l'identité boutique, par la base", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "drizzle/0019_misty_drax.sql"),
    "utf-8",
  );

  it("crée la table profils_clients", () => {
    expect(migration).toContain("CREATE TABLE `profils_clients`");
  });

  it("laisse les homonymes exister : ni le nom ni le contact ne sont uniques", () => {
    expect(migration).not.toMatch(/UNIQUE[^;]*`nom`/);
    expect(migration).not.toMatch(/UNIQUE[^;]*`contact_telephone`/);
  });

  it("indexe la recherche par contact et par nom", () => {
    expect(migration).toContain("profils_clients_contact_idx");
    expect(migration).toContain("profils_clients_nom_idx");
  });

  it("démarre tout profil en EN_EVALUATION", () => {
    expect(migration).toMatch(/`statut`.*DEFAULT 'EN_EVALUATION'/);
  });

  it("porte le plafond en montant et devise, sans aucun dérivé stocké", () => {
    expect(migration).toMatch(/`plafond_montant` int unsigned NOT NULL/);
    expect(migration).toMatch(/`plafond_devise` varchar\(3\) NOT NULL/);
    expect(migration).not.toMatch(/`dette`|disponible|`solde`/);
  });

  it("trace l'auteur de chaque profil (invariant 8)", () => {
    expect(migration).toMatch(/`cree_par` varchar\(36\) NOT NULL/);
  });

  it("reste additive : ni suppression ni modification", () => {
    expect(migration).not.toMatch(/DROP/);
    expect(migration).not.toMatch(/MODIFY/);
  });
});
