"use client";

import { useTheme, type Theme } from "@/components/theme-provider";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { type DensiteComptoir } from "./preferences";
import { usePreferencesAgent } from "./use-preferences-agent";

/**
 * Miniature « fenêtre navigateur » pour le choix visuel du thème.
 * Clair : fenêtre claire ; Sombre : fenêtre sombre ; Système : moitié
 * claire, moitié sombre. Purement décorative (`aria-hidden` côté appel).
 */
function ApercuTheme({ variante }: { variante: Theme }) {
  if (variante === "system") {
    return (
      <span className="grid h-20 grid-cols-2 gap-0 overflow-hidden rounded-lg border border-foreground/10 sm:h-24">
        <MiniFenetre sombre={false} />
        <MiniFenetre sombre />
      </span>
    );
  }
  return <MiniFenetre sombre={variante === "dark"} />;
}

function MiniFenetre({ sombre }: { sombre: boolean }) {
  return (
    <span
      className={cn(
        "flex h-20 flex-col overflow-hidden sm:h-24",
        sombre ? "bg-[#232936]" : "bg-slate-100",
      )}
    >
      <span className="flex gap-1 px-1.5 pt-1.5">
        <span className="size-1.5 rounded-full bg-red-400" />
        <span className="size-1.5 rounded-full bg-amber-400" />
        <span className="size-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="grid flex-1 grid-cols-[30%_1fr] gap-1 p-1.5">
        <span
          className={cn(
            "rounded-sm",
            sombre ? "bg-[#394052]" : "bg-white",
          )}
        />
        <span className="grid grid-rows-3 gap-1">
          <span
            className={cn(
              "rounded-sm",
              sombre ? "bg-[#394052]" : "bg-white",
            )}
          />
          <span
            className={cn(
              "rounded-sm",
              sombre ? "bg-[#394052]" : "bg-white",
            )}
          />
          <span
            className={cn(
              "rounded-sm",
              sombre ? "bg-[#394052]" : "bg-white",
            )}
          />
        </span>
      </span>
    </span>
  );
}

/**
 * Préférences d'appareil de l'agent de service.
 *
 * Thème via `ThemeProvider`, densité en `localStorage`
 * (clé `tks-agent-preferences`). Rien ne part au serveur : sur un téléphone
 * partagé au comptoir, ces réglages valent pour l'appareil.
 *
 * La densité sera consommée par la caisse rapide
 * et la file d'attente (S5) quand elles arriveront.
 */
export function AppareilSection() {
  const { theme, setTheme } = useTheme();
  const { preferences, chargees, mettreAJour } = usePreferencesAgent();

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
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[13px] font-semibold">Thème de l’écran</p>
        <div
          className="mt-2 grid grid-cols-3 gap-2 sm:gap-3"
          role="radiogroup"
          aria-label="Thème"
        >
          {themes.map((option) => {
            const actif = theme === option.valeur;
            return (
              <button
                key={option.valeur}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setTheme(option.valeur)}
                className={cn(
                  "overflow-hidden rounded-xl border text-left transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  actif
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-foreground/25",
                )}
              >
                <span
                  aria-hidden="true"
                  className="block p-2 pb-1.5"
                >
                  <ApercuTheme variante={option.valeur} />
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3",
                    actif && "bg-primary/[0.07]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      actif
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 text-transparent",
                    )}
                  >
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  <span className="truncate text-xs font-semibold sm:text-[13px]">
                    {option.etiquette}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold">Densité de la file</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Densité de la file d'attente">
          {densites.map((option) => (
            <Button
              key={option.valeur}
              type="button"
              variant={preferences.densite === option.valeur ? "default" : "outline"}
              size="sm"
              disabled={!chargees}
              onClick={() => mettreAJour({ densite: option.valeur })}
              aria-pressed={preferences.densite === option.valeur}
            >
              {option.etiquette}
            </Button>
          ))}
        </div>
        <FieldDescription className="mt-2">
          Stocké sur cet appareil uniquement — jamais synchronisé.
        </FieldDescription>
      </div>
    </div>
  );
}
