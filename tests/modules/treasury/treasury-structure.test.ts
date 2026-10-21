import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const DRIZZLE = resolve(process.cwd(), "drizzle");
const MODULE = resolve(process.cwd(), "src/modules/treasury");
const PORTE = resolve(process.cwd(), "src/platform/writes/index.ts");

function lire(chemin: string): string {
  return readFileSync(chemin, "utf-8");
}

function migrationTresorerie(): string {
  const trouvee = readdirSync(DRIZZLE)
    .filter((nom) => nom.endsWith(".sql"))
    .find((nom) => lire(resolve(DRIZZLE, nom)).includes("CREATE TABLE `cash_accounts`"));
  expect(trouvee, "aucune migration ne crée la table cash_accounts").toBeDefined();
  return lire(resolve(DRIZZLE, trouvee ?? ""));
}

function sourcesDuModule(): { nom: string; source: string }[] {
  return readdirSync(MODULE)
    .filter((nom) => nom.endsWith(".ts"))
    .map((nom) => ({ nom, source: lire(resolve(MODULE, nom)) }));
}

describe("S7 — le solde d'un compte se déduit, il ne se stocke pas", () => {
  it("ne crée aucune colonne de solde en base", () => {
    const migration = migrationTresorerie();
    expect(migration).toContain("CREATE TABLE `cash_accounts`");
    expect(migration).toContain("`opening_amount` int unsigned NOT NULL");
    expect(migration).not.toMatch(/`solde[^`]*`/);
    expect(migration).not.toMatch(/`balance[^`]*`/);
  });

  it("garde les comptes et les mouvements immuables, dans la base elle-même", () => {
    const migration = migrationTresorerie();
    expect(migration).toMatch(
      /CREATE TRIGGER `cash_movements_block_update` BEFORE UPDATE ON `cash_movements`[\s\S]*?SIGNAL SQLSTATE '45000'/,
    );
    expect(migration).toMatch(
      /CREATE TRIGGER `cash_movements_block_delete` BEFORE DELETE ON `cash_movements`[\s\S]*?SIGNAL SQLSTATE '45000'/,
    );
    expect(migration).toMatch(
      /CREATE TRIGGER `cash_accounts_block_delete` BEFORE DELETE ON `cash_accounts`[\s\S]*?SIGNAL SQLSTATE '45000'/,
    );
  });

  it("ferme les listes dans la base : type, sens, catégorie, devise, source", () => {
    const migration = migrationTresorerie();
    expect(migration).toContain("`type` IN ('CASH', 'ELECTRONIC_MONEY')");
    expect(migration).toContain("`direction` IN ('IN', 'OUT')");
    expect(migration).toContain("`source_kind` IN ('MANUAL', 'AUTOMATIC')");
    expect(migration).toContain("`currency` IN ('USD', 'CDF')");
    expect(migration).toContain(
      "'BANK_WITHDRAWAL', 'OPERATOR_TOPUP', 'REPAYMENT', 'OWNER_WITHDRAWAL'",
    );
    expect(migration).toContain("`amount` > 0");
  });

  it("ne pose aucune clé étrangère : la réplication hors-ligne les refuse", () => {
    const migration = migrationTresorerie();
    expect(migration).not.toContain("FOREIGN KEY");
  });
});

describe("S7 — la trésorerie écrit par la porte unique", () => {
  it("n'écrit jamais en base depuis le module autrement", () => {
    for (const { nom, source } of sourcesDuModule()) {
      expect(source, nom).not.toMatch(/\.\s*(insert|update|delete)\s*\(/);
      expect(source, nom).not.toContain("updateRow");
      expect(source, nom).not.toContain("deleteRow");
    }
  });

  it("passe par la porte d'écriture, qui reçoit la table en paramètre", () => {
    const publish = sourcesDuModule().find((f) => f.nom === "publish.ts");
    expect(publish?.source).toContain('from "@/platform/writes"');
    expect(publish?.source).toContain("insertRow(tx, cashAccounts");
    expect(publish?.source).toContain("insertRow(tx, cashMovements");
    const porte = lire(PORTE);
    expect(porte).not.toMatch(/from\s+"@\/(lib\/db\/schema|modules\/)/);
  });
});

describe("S7 — un transfert est atomique", () => {
  it("pose les deux mouvements dans une seule transaction", () => {
    const publish = sourcesDuModule().find((f) => f.nom === "publish.ts");
    const source = publish?.source ?? "";
    const debut = source.indexOf("export async function transferer");
    const fin = source.indexOf("export async function", debut + 10);
    const transfert = source.slice(debut, fin);
    expect(transfert).toContain("db.transaction(");
    const insertions = transfert.match(/insertRow\(tx, cashMovements/g) ?? [];
    expect(insertions).toHaveLength(2);
    expect(transfert).toContain("transferId");
  });
});

describe("S7 — une correction ne supprime rien", () => {
  it("pose une écriture inverse liée par corrected_of", () => {
    const publish = sourcesDuModule().find((f) => f.nom === "publish.ts");
    const source = publish?.source ?? "";
    const correction = source.slice(source.indexOf("export async function corriger"));
    expect(correction).toContain("kind: \"CORRECTION\"");
    expect(correction).toContain("correctedOf");
    expect(correction).toContain("sensCorrection");
    expect(correction).not.toMatch(/\.\s*delete\s*\(/);
  });
});
