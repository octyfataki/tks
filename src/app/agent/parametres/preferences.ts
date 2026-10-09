/**
 * Préférences d'appareil de l'agent de service (/agent/parametres).
 *
 * Stockage local uniquement (`localStorage`), jamais synchronisé : ce sont
 * des réglages du téléphone, pas des écritures métier. Sur un téléphone
 * partagé au comptoir (S1), ils valent pour l'appareil, pas pour le compte.
 *
 * Le thème passe par `ThemeProvider` (clé `tks-theme`) ; le reste vit sous
 * la clé unique ci-dessous. Le parse est tolérant : toute valeur illisible
 * retombe sur les défauts, jamais d'écran cassé.
 */

export const CLE_PREFERENCES_AGENT = "tks-agent-preferences";

export type DensiteComptoir = "confortable" | "compacte";

export type PreferencesAgent = {
  /** Bip sonore à la validation d'un geste au comptoir. */
  son: boolean;
  /** Vibration à la validation d'un geste au comptoir. */
  vibration: boolean;
  /** Densité de la file d'attente et de la caisse rapide (S5). */
  densite: DensiteComptoir;
};

export const PREFERENCES_DEFAUT: PreferencesAgent = {
  son: true,
  vibration: true,
  densite: "confortable",
};

function estDensite(valeur: unknown): valeur is DensiteComptoir {
  return valeur === "confortable" || valeur === "compacte";
}

/** Parse tolérant : objet partiel ou illisible -> défauts complétés. */
export function lirePreferences(valeur: unknown): PreferencesAgent {
  if (typeof valeur !== "object" || valeur === null) {
    return { ...PREFERENCES_DEFAUT };
  }
  const objet = valeur as Record<string, unknown>;
  return {
    son: typeof objet.son === "boolean" ? objet.son : PREFERENCES_DEFAUT.son,
    vibration:
      typeof objet.vibration === "boolean"
        ? objet.vibration
        : PREFERENCES_DEFAUT.vibration,
    densite: estDensite(objet.densite)
      ? objet.densite
      : PREFERENCES_DEFAUT.densite,
  };
}

export function serialiserPreferences(
  preferences: PreferencesAgent,
): string {
  return JSON.stringify(preferences);
}
