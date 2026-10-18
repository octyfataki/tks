import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const DRIZZLE = resolve(process.cwd(), "drizzle");
const MODULE = resolve(process.cwd(), "src/modules/pricing");
const PORTE = resolve(process.cwd(), "src/platform/writes/index.ts");

function lire(chemin: string): string {
  return readFileSync(chemin, "utf-8");
}

function migrationGrille(): string {
  const trouvee = readdirSync(DRIZZLE)
    .filter((nom) => nom.endsWith(".sql"))
    .find((nom) =>
      lire(resolve(DRIZZLE, nom)).includes("CREATE TABLE `price_grid`"),
    );
  expect(trouvee, "aucune migration ne crée la table price_grid").toBeDefined();
  return lire(resolve(DRIZZLE, trouvee ?? ""));
}

function sourcesDuModule(): { nom: string; source: string }[] {
  return readdirSync(MODULE)
    .filter((nom) => nom.endsWith(".ts"))
    .map((nom) => ({ nom, source: lire(resolve(MODULE, nom)) }));
}

describe("S5-01 — la grille tarifaire est append-only", () => {
  it("crée la table sans aucune clé d'unicité : un réseau porte un historique", () => {
    const migration = migrationGrille();
    expect(migration).toContain("CREATE TABLE `price_grid`");
    expect(migration).toContain("`effective_at` timestamp(3) NOT NULL");
    expect(migration).toContain("`entered_by` varchar(36) NOT NULL");
    expect(migration).not.toContain("UNIQUE");
  });

  it("rejette toute mise à jour et toute suppression, dans la base elle-même", () => {
    const migration = migrationGrille();
    expect(migration).toMatch(
      /CREATE TRIGGER `price_grid_block_update` BEFORE UPDATE ON `price_grid`[\s\S]*?SIGNAL SQLSTATE '45000'/,
    );
    expect(migration).toMatch(
      /CREATE TRIGGER `price_grid_block_delete` BEFORE DELETE ON `price_grid`[\s\S]*?SIGNAL SQLSTATE '45000'/,
    );
  });

  it("n'écrit jamais dans la base depuis le module, ni update ni delete", () => {
    for (const { nom, source } of sourcesDuModule()) {
      expect(source, nom).not.toMatch(/\.\s*(insert|update|delete)\s*\(/);
      expect(source, nom).not.toContain("updateRow");
      expect(source, nom).not.toContain("deleteRow");
    }
  });

  it("passe par la porte unique, qui reçoit la table en paramètre", () => {
    const publish = sourcesDuModule().find((f) => f.nom === "publish.ts");
    expect(publish?.source).toContain('from "@/platform/writes"');
    expect(publish?.source).toContain("insertRow(tx, priceGrid");
    const porte = lire(PORTE);
    expect(porte).not.toMatch(/from\s+"@\/(lib\/db\/schema|modules\/)/);
  });
});
