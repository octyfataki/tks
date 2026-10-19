"use client";

import * as React from "react";
import { format, parseISO, startOfMonth, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarRangeIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "cn";

function versPlage(du: string, au: string): DateRange | undefined {
  if (!du && !au) return undefined;
  return {
    from: du ? parseISO(du) : undefined,
    to: au ? parseISO(au) : undefined,
  };
}

function libellePlage(du: string, au: string): string {
  if (!du && !au) return "Toutes les dates";
  if (du && !au) return `Depuis le ${format(parseISO(du), "d MMM yyyy", { locale: fr })}`;
  if (!du && au) return `Jusqu'au ${format(parseISO(au), "d MMM yyyy", { locale: fr })}`;
  const debut = parseISO(du);
  const fin = parseISO(au);
  if (debut.getFullYear() === fin.getFullYear()) {
    return `${format(debut, "d MMM", { locale: fr })} – ${format(fin, "d MMM yyyy", { locale: fr })}`;
  }
  return `${format(debut, "d MMM yyyy", { locale: fr })} – ${format(fin, "d MMM yyyy", { locale: fr })}`;
}

export function RangeFilter({
  du,
  au,
  onChange,
}: {
  du: string;
  au: string;
  onChange: (du: string, au: string) => void;
}) {
  const isMobile = useIsMobile();
  const [ouvert, setOuvert] = React.useState(false);
  const [plage, setPlage] = React.useState<DateRange | undefined>(() =>
    versPlage(du, au),
  );

  const aujourdHui = new Date();
  const presets = [
    { etiquette: "7 jours", plage: { from: subDays(aujourdHui, 6), to: aujourdHui } },
    { etiquette: "30 jours", plage: { from: subDays(aujourdHui, 29), to: aujourdHui } },
    { etiquette: "Ce mois-ci", plage: { from: startOfMonth(aujourdHui), to: aujourdHui } },
  ];

  function appliquer(suivante: DateRange) {
    onChange(
      suivante.from ? format(suivante.from, "yyyy-MM-dd") : "",
      suivante.to ? format(suivante.to, "yyyy-MM-dd") : "",
    );
    setPlage(suivante);
    setOuvert(false);
  }

  function changerOuverture(suivant: boolean) {
    if (suivant) setPlage(versPlage(du, au));
    setOuvert(suivant);
  }

  const actif = du !== "" || au !== "";

  return (
    <Popover open={ouvert} onOpenChange={changerOuverture}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-label={`Période : ${libellePlage(du, au)}`}
            className={cn("justify-start font-normal", !actif && "text-muted-foreground")}
          />
        }
      >
        <CalendarRangeIcon />
        {libellePlage(du, au)}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-wrap gap-1 border-b p-2">
          {presets.map((preset) => (
            <Button
              key={preset.etiquette}
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => appliquer(preset.plage)}
            >
              {preset.etiquette}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={plage}
          defaultMonth={plage?.from}
          numberOfMonths={isMobile ? 1 : 2}
          locale={fr}
          onSelect={(suivante) => setPlage(suivante)}
        />
        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!actif && !plage?.from}
            onClick={() => appliquer({ from: undefined, to: undefined })}
          >
            Effacer
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!plage?.from}
            onClick={() => {
              if (plage?.from) appliquer(plage);
            }}
          >
            Appliquer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
