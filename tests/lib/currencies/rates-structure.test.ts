import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("S3 — un jour porte au plus un taux, par la base", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "drizzle/0014_sudden_ozymandias.sql"),
    "utf-8",
  );

  it("crée la table taux_change avec l'unicité sur le jour civil", () => {
    expect(migration).toContain("CREATE TABLE `taux_change`");
    expect(migration).toMatch(
      /CONSTRAINT `taux_change_jour_unique` UNIQUE\(`jour`\)/,
    );
  });

  it("ne rattache aucun champ taux à une éventuelle table d'écriture", () => {
    const autresTables = migration
      .split("--> statement-breakpoint")
      .filter((morceau) => /(CREATE|ADD COLUMN)/i.test(morceau))
      .filter((morceau) => !morceau.includes("`taux_change`"));
    for (const morceau of autresTables) {
      expect(morceau.toLowerCase()).not.toMatch(/`?taux`?\s/);
    }
  });
});