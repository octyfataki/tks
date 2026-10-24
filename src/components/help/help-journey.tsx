"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRightIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AideParcours } from "@/lib/help-content";

export function AideParcoursBloc({
  parcours,
  afficherTheme = false,
}: {
  parcours: AideParcours;
  afficherTheme?: boolean;
}) {
  const bientot = parcours.bientot === true;
  const [ouvert, setOuvert] = useState(false);

  return (
    <article className="h-full">
      <Card
        data-parcours={parcours.id}
        className={cn(
          "h-full gap-0 py-0 border",
          bientot && "border-dashed bg-muted/20",
        )}
      >
        <CardHeader className="gap-0 px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {afficherTheme ? (
                <p className="mb-1 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  {parcours.theme}
                </p>
              ) : null}
              <CardTitle className="font-heading text-[15px] leading-tight font-semibold text-foreground">
                {!bientot && parcours.lien ? (
                  <Link
                    href={parcours.lien.href}
                    className="text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {parcours.titre}
                  </Link>
                ) : (
                  parcours.titre
                )}
              </CardTitle>
              <CardDescription className="mt-3 max-w-[65ch]">
                {parcours.resume}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {bientot ? (
                <Badge variant="secondary" className="shrink-0">
                  Bientôt
                </Badge>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                aria-label={ouvert ? "Masquer les détails" : "Afficher les détails"}
                aria-expanded={ouvert}
                aria-controls={`aide-parcours-${parcours.id}`}
                onClick={() => setOuvert(!ouvert)}
                className={cn(
                  "size-6 rounded-md transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  ouvert
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {ouvert ? (
                  <ChevronUpIcon aria-hidden className="size-3.5" />
                ) : (
                  <ChevronRightIcon aria-hidden className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {ouvert ? (
          <CardContent className="px-4 pb-5">
            <ul className="mt-4 flex flex-col gap-3">
              {parcours.etapes.map((etape) => (
                <li key={etape} className="flex items-start gap-2.5">
                  <ChevronRightIcon
                    aria-hidden
                    className="mt-[3px] size-3.5 shrink-0 text-primary/60"
                  />
                  <span className="text-[13px] leading-relaxed text-muted-foreground">
                    {etape}
                  </span>
                </li>
              ))}
            </ul>
            {parcours.garde ? (
              <p className="mt-4 flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
                <ShieldCheckIcon
                  aria-hidden
                  className="mt-px size-3.5 shrink-0 text-foreground/60"
                />
                <span>
                  <strong className="font-medium text-foreground">
                    À savoir :{" "}
                  </strong>
                  {parcours.garde}
                </span>
              </p>
            ) : null}
          </CardContent>
        ) : null}

        {!bientot && parcours.lien && ouvert ? (
          <CardFooter className="border-t border-t-border/50 px-4 py-3">
            <Link
              href={parcours.lien.href}
              className="group inline-flex items-center gap-1 rounded-sm text-[13px] font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {parcours.lien.libelle}
              <ArrowUpRightIcon
                aria-hidden
                className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </CardFooter>
        ) : null}
      </Card>
    </article>
  );
}
