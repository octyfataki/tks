import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("S3 — le taux en vigueur, par la base", () => {
  const creation = readFileSync(
    resolve(process.cwd(), "drizzle/0014_sudden_ozymandias.sql"),
    "utf-8",
  );
  const refonte = readFileSync(
    resolve(process.cwd(), "drizzle/0021_taux-en-vigueur.sql"),
    "utf-8",
  );

  it("crée la table taux_change", () => {
    expect(creation).toContain("CREATE TABLE `taux_change`");
  });

  it("délèche le jour de son unicité : le jour n'est plus la clé du taux", () => {
    expect(refonte).toContain(
      "ALTER TABLE `taux_change` DROP INDEX `taux_change_jour_unique`",
    );
  });

  it("fait du numéro de séquence la clé d'ordre du taux", () => {
    expect(refonte).toMatch(/ADD `numero` bigint unsigned/);
    expect(refonte).toMatch(
      /CONSTRAINT `taux_change_numero_unique` UNIQUE\(`numero`\)/,
    );
  });

  it("reorder les lignes existantes sans perdre la valeur première", () => {
    expect(refonte).toMatch(/ROW_NUMBER\(\) OVER \(ORDER BY `horodatage_local`, `recu_le`\)/);
  });

  it("ne rattache aucun champ taux à une éventuelle table d'écriture", () => {
    const autresTables = creation
      .split("--> statement-breakpoint")
      .filter((morceau) => /(CREATE|ADD COLUMN)/i.test(morceau))
      .filter((morceau) => !morceau.includes("`taux_change`"));
    for (const morceau of autresTables) {
      expect(morceau.toLowerCase()).not.toMatch(/`?taux`?\s/);
    }
  });
});
