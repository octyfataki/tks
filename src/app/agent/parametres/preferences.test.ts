import { describe, expect, it } from "vitest";
import {
  PREFERENCES_DEFAUT,
  lirePreferences,
  serialiserPreferences,
} from "./preferences";

// Préférences d'appareil : stockage local, jamais synchronisé. Le parse ne
// casse jamais l'écran : toute valeur illisible retombe sur les défauts.
describe("lirePreferences", () => {
  it("retombe sur les défauts quand il n'y a rien de lisible", () => {
    for (const valeur of [null, undefined, "texte", 42, []]) {
      expect(lirePreferences(valeur)).toEqual(PREFERENCES_DEFAUT);
    }
  });

  it("complète un objet partiel avec les défauts", () => {
    expect(lirePreferences({ son: false })).toEqual({
      ...PREFERENCES_DEFAUT,
      son: false,
    });
  });

  it("refuse une densité inconnue", () => {
    expect(lirePreferences({ densite: "serrée" }).densite).toBe(
      PREFERENCES_DEFAUT.densite,
    );
    expect(lirePreferences({ densite: "compacte" }).densite).toBe("compacte");
  });

  it("sérialise puis relit sans perte", () => {
    const preferences = { son: false, vibration: true, densite: "compacte" as const };
    expect(lirePreferences(JSON.parse(serialiserPreferences(preferences)))).toEqual(
      preferences,
    );
  });
});
