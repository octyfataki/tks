"use client";

import { useEffect, useState } from "react";
import {
  CLIENT_PREFERENCES_KEY,
  DEFAULT_PREFERENCES,
  readPreferences,
  serializePreferences,
  type ClientPreferences,
} from "./preferences";

export function useClientPreferences() {
  const [preferences, setPreferences] =
    useState<ClientPreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CLIENT_PREFERENCES_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage local après montage : évite le désaccord d'hydratation (serveur = défauts, client = valeurs stockées)
      setPreferences(
        readPreferences(raw ? (JSON.parse(raw) as unknown) : null),
      );
    } catch {
      setPreferences({ ...DEFAULT_PREFERENCES });
    } finally {
      setLoaded(true);
    }
  }, []);

  function update(patch: Partial<ClientPreferences>) {
    const next: ClientPreferences = { ...preferences, ...patch };
    setPreferences(next);
    try {
      window.localStorage.setItem(
        CLIENT_PREFERENCES_KEY,
        serializePreferences(next),
      );
    } catch {
    }
  }

  return { preferences, loaded, update };
}