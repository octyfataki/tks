import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_CATALOG,
  NOTIFICATION_GROUPS,
  DEFAULT_PREFERENCES,
  readPreferences,
  serializePreferences,
} from "@/app/clients/settings/preferences";

describe("readPreferences", () => {
  it("retombe sur les défauts quand il n'y a rien de lisible", () => {
    for (const value of [null, undefined, "texte", 42, []]) {
      expect(readPreferences(value)).toEqual(DEFAULT_PREFERENCES);
    }
  });

  it("complète un objet partiel avec les défauts", () => {
    expect(readPreferences({ densite: "compacte" })).toEqual({
      ...DEFAULT_PREFERENCES,
      densite: "compacte",
    });
  });

  it("ignore les anciennes clés son et vibration", () => {
    expect(
      readPreferences({ son: false, vibration: true, densite: "compacte" }),
    ).toEqual({
      densite: "compacte",
      notifications: DEFAULT_PREFERENCES.notifications,
    });
  });

  it("refuse une densité inconnue", () => {
    expect(readPreferences({ densite: "serrée" }).densite).toBe(
      DEFAULT_PREFERENCES.densite,
    );
    expect(readPreferences({ densite: "compacte" }).densite).toBe("compacte");
  });

  it("sérialise puis relit sans perte", () => {
    const preferences = {
      densite: "compacte" as const,
      notifications: {
        ...DEFAULT_PREFERENCES.notifications,
        taux: { actif: false, canal: "vibration" as const },
      },
    };
    expect(readPreferences(JSON.parse(serializePreferences(preferences)))).toEqual(
      preferences,
    );
  });

  it("refuse un canal inconnu et un réglage illisible", () => {
    const read = readPreferences({
      notifications: {
        taux: { actif: "oui", canal: "tambour" },
        session: null,
      },
    });
    expect(read.notifications.taux).toEqual(
      DEFAULT_PREFERENCES.notifications.taux,
    );
    expect(read.notifications.session).toEqual(
      DEFAULT_PREFERENCES.notifications.session,
    );
  });

  it("couvre chaque événement du catalogue avec un groupe existant", () => {
    const groups = new Set(NOTIFICATION_GROUPS.map((g) => g.value));
    for (const entry of NOTIFICATION_CATALOG) {
      expect(groups.has(entry.group)).toBe(true);
      expect(
        DEFAULT_PREFERENCES.notifications[entry.key],
      ).toBeDefined();
    }
    expect(Object.keys(DEFAULT_PREFERENCES.notifications)).toHaveLength(
      NOTIFICATION_CATALOG.length,
    );
  });
});
