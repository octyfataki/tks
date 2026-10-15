"use client";

import { useEffect, useState } from "react";
import {
  CLE_PREFERENCES_CLIENT,
  PREFERENCES_DEFAUT,
  lirePreferences,
  serialiserPreferences,
  type PreferencesClient,
} from "./preferences";

export function usePreferencesClient() {
  const [preferences, setPreferences] =
    useState<PreferencesClient>(PREFERENCES_DEFAUT);
  const [chargees, setChargees] = useState(false);

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_PREFERENCES_CLIENT);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local après montage : évite le désaccord d'hydratation (serveur = défauts, client = valeurs stockées)
      setPreferences(
        lirePreferences(brut ? (JSON.parse(brut) as unknown) : null),
      );
    } catch {
      setPreferences({ ...PREFERENCES_DEFAUT });
    } finally {
      setChargees(true);
    }
  }, []);

  function mettreAJour(correctif: Partial<PreferencesClient>) {
    const suivantes: PreferencesClient = { ...preferences, ...correctif };
    setPreferences(suivantes);
    try {
      window.localStorage.setItem(
        CLE_PREFERENCES_CLIENT,
        serialiserPreferences(suivantes),
      );
    } catch {
    }
  }

  return { preferences, chargees, mettreAJour };
}
