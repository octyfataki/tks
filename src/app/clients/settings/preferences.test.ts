import { describe, expect, it } from "vitest";
import {
  CATALOGUE_NOTIFICATIONS,
  GROUPES_NOTIFICATION,
  PREFERENCES_DEFAUT,
  lirePreferences,
  serialiserPreferences,
} from "./preferences";

// Préférences d'appareil du client : stockage local, jamais synchronisé.
// Le parse ne casse jamais l'écran : toute valeur illisible retombe sur
// les défauts.
describe("lirePreferences", () => {
  it("retombe sur les défauts quand il n'y a rien de lisible", () => {
    for (const valeur of [null, undefined, "texte", 42, []]) {
      expect(lirePreferences(valeur)).toEqual(PREFERENCES_DEFAUT);
    }
  });

  it("complète un objet partiel avec les défauts", () => {
    expect(lirePreferences({ densite: "compacte" })).toEqual({
      ...PREFERENCES_DEFAUT,
      densite: "compacte",
    });
  });

  it("ignore les anciennes clés son et vibration", () => {
    expect(
      lirePreferences({ son: false, vibration: true, densite: "compacte" }),
    ).toEqual({
      densite: "compacte",
      notifications: PREFERENCES_DEFAUT.notifications,
    });
  });

  it("refuse une densité inconnue", () => {
    expect(lirePreferences({ densite: "serrée" }).densite).toBe(
      PREFERENCES_DEFAUT.densite,
    );
    expect(lirePreferences({ densite: "compacte" }).densite).toBe("compacte");
  });

  it("sérialise puis relit sans perte", () => {
    const preferences = {
      densite: "compacte" as const,
      notifications: {
        ...PREFERENCES_DEFAUT.notifications,
        taux: { actif: false, canal: "vibration" as const },
      },
    };
    expect(lirePreferences(JSON.parse(serialiserPreferences(preferences)))).toEqual(
      preferences,
    );
  });

  it("refuse un canal inconnu et un réglage illisible", () => {
    const lues = lirePreferences({
      notifications: {
        taux: { actif: "oui", canal: "tambour" },
        session: null,
      },
    });
    expect(lues.notifications.taux).toEqual(
      PREFERENCES_DEFAUT.notifications.taux,
    );
    expect(lues.notifications.session).toEqual(
      PREFERENCES_DEFAUT.notifications.session,
    );
  });

  it("couvre chaque événement du catalogue avec un groupe existant", () => {
    const groupes = new Set(GROUPES_NOTIFICATION.map((g) => g.valeur));
    for (const entree of CATALOGUE_NOTIFICATIONS) {
      expect(groupes.has(entree.groupe)).toBe(true);
      expect(
        PREFERENCES_DEFAUT.notifications[entree.cle],
      ).toBeDefined();
    }
    expect(Object.keys(PREFERENCES_DEFAUT.notifications)).toHaveLength(
      CATALOGUE_NOTIFICATIONS.length,
    );
  });
});
