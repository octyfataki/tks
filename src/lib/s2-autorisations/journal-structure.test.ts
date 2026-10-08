import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// S2 issue 01 — test structurel : l'immuabilité du journal est garantie
// par la base (triggers), pas par l'application. Échoue dès que la
// migration perd un trigger — exactement le jour où la promesse cesserait
// d'être vraie.
describe("S2 — journal immuable par la base", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "drizzle/0006_careless_daimon_hellstrom.sql"),
    "utf-8",
  );

  it("rejette toute mise à jour du journal", () => {
    expect(migration).toContain("journal_audit_bloque_update");
    expect(migration).toMatch(/BEFORE UPDATE ON `journal_audit`/);
  });

  it("rejette toute suppression du journal", () => {
    expect(migration).toContain("journal_audit_bloque_delete");
    expect(migration).toMatch(/BEFORE DELETE ON `journal_audit`/);
  });

  it("le journal n'a aucune colonne de mise à jour applicative", () => {
    expect(migration).not.toMatch(/UPDATE `journal_audit`/);
  });
});
