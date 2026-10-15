import { describe, expect, it } from "vitest";
import {
  estEtiquetteConnue,
  etiquetteParCode,
  etiquettesOrdonnees,
  ETIQUETTES_FERMEES,
} from "@/lib/annotations/labels";

// S4 issue #7 — la liste des étiquettes est fermée et vit dans le code.
// Aucune étiquette ne s'invente à l'exécution : l'inconnue vaut refus.

describe("S4 — liste fermée des étiquettes d'annotation", () => {
  it("contient exactement les trois repères opérationnels", () => {
    expect(ETIQUETTES_FERMEES.map((e) => e.code)).toEqual([
      "A_SURVEILLER",
      "BON_PAYEUR",
      "CLIENT_CONFIANCE",
    ]);
  });

  it("porte un libellé français et une teinte par étiquette", () => {
    for (const etiquette of ETIQUETTES_FERMEES) {
      expect(etiquette.libelle.length).toBeGreaterThan(0);
      expect(["rouge", "vert", "bleu"]).toContain(etiquette.teinte);
    }
  });

  it("reconnaît les connues, refuse l'inventée", () => {
    expect(estEtiquetteConnue("BON_PAYEUR")).toBe(true);
    expect(estEtiquetteConnue("MAUVAIS_PAYEUR")).toBe(false);
    expect(estEtiquetteConnue("")).toBe(false);
  });

  it("retrouve par code, rien pour l'inconnu", () => {
    expect(etiquetteParCode("A_SURVEILLER")?.libelle).toBe("À surveiller");
    expect(etiquetteParCode("INCONNUE")).toBeNull();
  });

  it("ordonne selon la liste, jamais selon l'arrivée en base", () => {
    expect(etiquettesOrdonnees(["CLIENT_CONFIANCE", "A_SURVEILLER"])).toEqual([
      "A_SURVEILLER",
      "CLIENT_CONFIANCE",
    ]);
    expect(etiquettesOrdonnees(["INCONNUE", "BON_PAYEUR"])).toEqual([
      "BON_PAYEUR",
    ]);
    expect(etiquettesOrdonnees([])).toEqual([]);
  });
});
