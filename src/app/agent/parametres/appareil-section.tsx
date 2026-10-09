"use client";

import { useEffect, useState } from "react";
import { useTheme, type Theme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  CLE_PREFERENCES_AGENT,
  PREFERENCES_DEFAUT,
  lirePreferences,
  serialiserPreferences,
  type DensiteComptoir,
  type PreferencesAgent,
} from "./preferences";

/**
 * Préférences d'appareil de l'agent de service.
 *
 * Thème via `ThemeProvider`, son / vibration / densité en `localStorage`
 * (clé `tks-agent-preferences`). Rien ne part au serveur : sur un téléphone
 * partagé au comptoir, ces réglages valent pour l'appareil.
 *
 * Le son, la vibration et la densité seront consommés par la caisse rapide
 * et la file d'attente (S5) quand elles arriveront.
 */
export function AppareilSection() {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] =
    useState<PreferencesAgent>(PREFERENCES_DEFAUT);
  const [chargees, setChargees] = useState(false);

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE_PREFERENCES_AGENT);
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

  function mettreAJour(suivantes: PreferencesAgent) {
    setPreferences(suivantes);
    try {
      window.localStorage.setItem(
        CLE_PREFERENCES_AGENT,
        serialiserPreferences(suivantes),
      );
    } catch {
      // Stockage indisponible (navigation privée) : réglage de séance.
    }
  }

  const themes: { valeur: Theme; etiquette: string }[] = [
    { valeur: "light", etiquette: "Clair" },
    { valeur: "dark", etiquette: "Sombre" },
    { valeur: "system", etiquette: "Système" },
  ];
  const densites: { valeur: DensiteComptoir; etiquette: string }[] = [
    { valeur: "confortable", etiquette: "Confortable" },
    { valeur: "compacte", etiquette: "Compacte" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium">Thème</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Thème">
          {themes.map((option) => (
            <Button
              key={option.valeur}
              type="button"
              variant={theme === option.valeur ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(option.valeur)}
              aria-pressed={theme === option.valeur}
            >
              {option.etiquette}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium">Alertes du comptoir</p>
        <div className="mt-2 flex flex-col gap-2">
          {(
            [
              { cle: "son", etiquette: "Son à la validation d'un geste" },
              { cle: "vibration", etiquette: "Vibration à la validation d'un geste" },
            ] as const
          ).map((option) => (
            <label
              key={option.cle}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm",
                !chargees && "opacity-60",
              )}
            >
              <span>{option.etiquette}</span>
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={preferences[option.cle]}
                disabled={!chargees}
                onChange={(event) =>
                  mettreAJour({
                    ...preferences,
                    [option.cle]: event.target.checked,
                  })
                }
              />
            </label>
          ))}
        </div>
        <FieldDescription className="mt-2">
          Pris en compte par la caisse rapide quand elle arrivera (S5).
        </FieldDescription>
      </div>

      <div>
        <p className="text-xs font-medium">Densité de la file d&apos;attente</p>
        <div
          className="mt-2 flex flex-wrap gap-2"
          role="group"
          aria-label="Densité de la file d'attente"
        >
          {densites.map((option) => (
            <Button
              key={option.valeur}
              type="button"
              variant={
                preferences.densite === option.valeur ? "default" : "outline"
              }
              size="sm"
              disabled={!chargees}
              onClick={() =>
                mettreAJour({ ...preferences, densite: option.valeur })
              }
              aria-pressed={preferences.densite === option.valeur}
            >
              {option.etiquette}
            </Button>
          ))}
        </div>
        <FieldDescription className="mt-2">
          Stocké sur cet appareil uniquement — jamais synchronisé. Sur un
          téléphone partagé, ces réglages valent pour l&apos;appareil.
        </FieldDescription>
      </div>
    </div>
  );
}
