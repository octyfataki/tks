import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// S2 issue 15 — test structurel : le fil « erreur → correction » vit dans
// une colonne NULLABLE et indexée, ajoutée sans toucher aux triggers
// d'immuabilité. Échoue dès que la migration perd la colonne, l'index, ou
// affaiblit le journal — exactement le jour où la promesse cesserait d'être
// vraie.
describe("S2 — le journal porte le lien de contestation", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "drizzle/0015_sharp_violations.sql"),
    "utf-8",
  );
  const socle = readFileSync(
    resolve(process.cwd(), "drizzle/0006_careless_daimon_hellstrom.sql"),
    "utf-8",
  );

  it("ajoute une colonne de lien vers la ligne contestée", () => {
    expect(migration).toMatch(/ADD `conteste_id`/);
  });

  it("indexe la colonne pour remonter le fil dans les deux sens", () => {
    expect(migration).toContain("journal_audit_conteste_idx");
  });

  it("reste additive : ni suppression ni modification de colonne", () => {
    expect(migration).not.toMatch(/DROP/);
    expect(migration).not.toMatch(/MODIFY/);
  });

  it("ne touche pas aux triggers d'immuabilité du socle", () => {
    expect(socle).toContain("journal_audit_bloque_update");
    expect(socle).toContain("journal_audit_bloque_delete");
  });
});
