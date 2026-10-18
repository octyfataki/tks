import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Ticket 10 — le verdict d'une pièce est stocké, pas déduit", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "drizzle/0018_stale_silver_sable.sql"),
    "utf-8",
  );

  it("ajoute un statut de pièce obligatoire, avec une valeur par défaut", () => {
    expect(migration).toContain("ADD `statut_piece`");
    expect(migration).toMatch(/`statut_piece`[^;]*NOT NULL/);
    expect(migration).toContain("DEFAULT 'EN_ATTENTE'");
  });

  it("ajoute un motif de refus, vide tant que la pièce n'est pas refusée", () => {
    expect(migration).toContain("ADD `refus_motif` text");
    expect(migration).not.toMatch(/`refus_motif`[^;]*NOT NULL/);
  });

  it("ne supprime rien : ni vue_par, ni vue_le, ni reference_image", () => {
    expect(migration).not.toMatch(/DROP|TRUNCATE|DELETE/i);
  });

  it("rattrape les pièces déjà vues par un humain avant la migration", () => {
    expect(migration).toContain(
      "UPDATE `pieces_identite_clients` SET `statut_piece` = 'ACCEPTEE' WHERE `vue_par` IS NOT NULL",
    );
  });
});