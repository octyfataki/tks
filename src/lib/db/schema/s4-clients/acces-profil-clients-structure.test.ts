import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("S4 — l'accès au profil est une entité tracée, et la base en tient les règles", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "drizzle/0020_free_maria_hill.sql"),
    "utf-8",
  );

  it("crée la table acces_profil_clients", () => {
    expect(migration).toContain("CREATE TABLE `acces_profil_clients`");
  });

  it("rattache l'accès aux deux identifiants, jamais à un téléphone", () => {
    expect(migration).toMatch(/`compte_client_id` varchar\(36\) NOT NULL/);
    expect(migration).toMatch(/`profil_client_id` varchar\(36\) NOT NULL/);
    expect(migration).not.toMatch(/telephone/);
  });

  it("interdit deux accès actifs pour un même compte (invariant 7)", () => {
    expect(migration).toMatch(
      /UNIQUE KEY `acces_profil_clients_compte_actif_uq` \(`compte_actif`\)|CONSTRAINT `acces_profil_clients_compte_actif_uq` UNIQUE\(`compte_actif`\)/,
    );
  });

  it("interdit deux comptes actifs pour un même profil", () => {
    expect(migration).toMatch(
      /UNIQUE KEY `acces_profil_clients_profil_actif_uq` \(`profil_actif`\)|CONSTRAINT `acces_profil_clients_profil_actif_uq` UNIQUE\(`profil_actif`\)/,
    );
  });

  it("dérive les deux unicités du statut : un accès révoqué ne bloque plus", () => {
    expect(migration).toMatch(
      /`compte_actif` varchar\(36\) GENERATED ALWAYS AS \(\(if\(`statut` = 'ACCORDE', `compte_client_id`, null\)\)\) VIRTUAL/,
    );
    expect(migration).toMatch(
      /`profil_actif` varchar\(36\) GENERATED ALWAYS AS \(\(if\(`statut` = 'ACCORDE', `profil_client_id`, null\)\)\) VIRTUAL/,
    );
  });

  it("trace l'acteur et le motif de la décision (invariant 8)", () => {
    expect(migration).toMatch(/`decide_par` varchar\(36\) NOT NULL/);
    expect(migration).toMatch(/`motif` varchar\(500\)/);
  });

  it("garde un horodatage local jamais réécrit par le serveur (ADR-0003)", () => {
    expect(migration).toMatch(/`horodatage_local` timestamp\(3\) NOT NULL/);
  });

  it("n'emporte aucune donnée financière", () => {
    expect(migration).not.toMatch(/creance|paiement|commande|montant|devise|plafond/);
  });

  it("reste additive : ni suppression, ni modification, ni renommage", () => {
    expect(migration).not.toMatch(/DROP/);
    expect(migration).not.toMatch(/MODIFY/);
    expect(migration).not.toMatch(/ALTER TABLE `profils_clients`/);
    expect(migration).not.toMatch(/UPDATE/);
  });
});