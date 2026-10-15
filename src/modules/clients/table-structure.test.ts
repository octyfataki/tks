import { describe, expect, it } from "vitest";
import { Column } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { dossiersClients } from "./table";

// Verrouille la structure : nom libre et non unique, contact indexé mais
// non unique. Un UNIQUE ajouté « pour aller plus vite » casserait les
// homonymes ou les contacts partagés — ce test l'interdit.
const config = getTableConfig(dossiersClients);

describe("structure des dossiers clients", () => {
  it("porte les colonnes de la fiche, sans solde ni statut stocké", () => {
    const colonnes = Object.values(config.columns).map((colonne) => colonne.name);
    expect(colonnes).toEqual(
      expect.arrayContaining([
        "id",
        "nom",
        "contact",
        "adresse",
        "cree_par",
        "horodatage_local",
        "recu_le",
      ]),
    );
    expect(colonnes).not.toContain("solde");
    expect(colonnes).not.toContain("dette");
    expect(colonnes).not.toContain("plafond");
  });

  it("le contact est indexé, et aucun index n'est unique", () => {
    const porteContact = (colonnes: readonly unknown[]): boolean =>
      colonnes.some(
        (colonne) => colonne instanceof Column && colonne.name === "contact",
      );
    const surContact = config.indexes.filter((index) =>
      porteContact(index.config.columns),
    );
    expect(surContact.length).toBeGreaterThan(0);
    for (const index of config.indexes) {
      expect(index.config.unique).not.toBe(true);
    }
  });
});
