"use client";

import { useTheme, type Theme } from "@/components/theme-provider";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { type ListDensity } from "./preferences";
import { useClientPreferences } from "./use-preferences-client";

function ThemePreview({ theme }: { theme: Theme }) {
  if (theme === "system") {
    return (
      <span className="grid h-20 grid-cols-2 gap-0 overflow-hidden rounded-lg border border-foreground/10 sm:h-24">
        <MiniWindow dark={false} />
        <MiniWindow dark />
      </span>
    );
  }
  return <MiniWindow dark={theme === "dark"} />;
}

function MiniWindow({ dark }: { dark: boolean }) {
  return (
    <span
      className={cn(
        "flex h-20 flex-col overflow-hidden sm:h-24",
        dark ? "bg-[#232936]" : "bg-slate-100",
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
            dark ? "bg-[#394052]" : "bg-white",
          )}
        />
        <span className="grid grid-rows-3 gap-1">
          <span
            className={cn(
              "rounded-sm",
              dark ? "bg-[#394052]" : "bg-white",
            )}
          />
          <span
            className={cn(
              "rounded-sm",
              dark ? "bg-[#394052]" : "bg-white",
            )}
          />
          <span
            className={cn(
              "rounded-sm",
              dark ? "bg-[#394052]" : "bg-white",
            )}
          />
        </span>
      </span>
    </span>
  );
}

export function DeviceSection() {
  const { theme, setTheme } = useTheme();
  const { preferences, loaded, update } = useClientPreferences();

  const themes: { value: Theme; label: string }[] = [
    { value: "light", label: "Clair" },
    { value: "dark", label: "Sombre" },
    { value: "system", label: "Système" },
  ];
  const densities: { value: ListDensity; label: string }[] = [
    { value: "confortable", label: "Confortable" },
    { value: "compacte", label: "Compacte" },
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
            const isSelected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "overflow-hidden rounded-xl border text-left transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-foreground/25",
                )}
              >
                <span
                  aria-hidden="true"
                  className="block p-2 pb-1.5"
                >
                  <ThemePreview theme={option.value} />
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3",
                    isSelected && "bg-primary/[0.07]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 text-transparent",
                    )}
                  >
                    <CheckIcon className="size-3" strokeWidth={3} />
                  </span>
                  <span className="truncate text-xs font-semibold sm:text-[13px]">
                    {option.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold">Densité des listes</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Densité des listes de commandes et de paiements">
          {densities.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={preferences.densite === option.value ? "default" : "outline"}
              size="sm"
              disabled={!loaded}
              onClick={() => update({ densite: option.value })}
              aria-pressed={preferences.densite === option.value}
            >
              {option.label}
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
