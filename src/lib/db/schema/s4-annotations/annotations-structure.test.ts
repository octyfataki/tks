import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// S4 issue #7 — test structurel de la migration des annotations : chaque
// geste est une LIGNE append-only, et l'état courant ne se stocke nulle
// part (invariant 10). Échoue dès que la migration ajoute une colonne
// d'état ou perd un index — exactement le jour où la promesse cesserait
// d'être vraie.
describe("S4 — les annotations vivent en journal append-only, par la base", () => {
  const creation = readFileSync(
    resolve(process.cwd(), "drizzle/0016_crazy_layla_miller.sql"),
    "utf-8",
  );
  const attribution = readFileSync(
    resolve(process.cwd(), "drizzle/0017_dazzling_nitro.sql"),
    "utf-8",
  );

  it("crée la table annotations_clients", () => {
    expect(creation).toContain("CREATE TABLE `annotations_clients`");
  });

  it("ne stocke aucun état courant : ni colonne d'état, ni drapeau actif", () => {
    expect(creation).not.toMatch(/`etat`|actif|active/);
  });

  it("indexe la lecture par compte et par paire compte-étiquette", () => {
    expect(creation).toContain("annotations_clients_compte_idx");
    expect(creation).toContain("annotations_clients_compte_etiquette_idx");
  });

  it("reste additive : ni suppression ni modification", () => {
    expect(creation).not.toMatch(/DROP/);
    expect(creation).not.toMatch(/MODIFY/);
  });

  it("attribue chaque geste : acteur obligatoire (invariant 8)", () => {
    expect(attribution).toMatch(
      /`acteur_id` varchar\(36\) NOT NULL/,
    );
  });
});
