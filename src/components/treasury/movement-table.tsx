"use client";

import * as React from "react";
import { ArrowDownLeftIcon, ArrowUpRightIcon, RepeatIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  DIRECTION_LABELS,
  type CashCategory,
  type MovementDirection,
} from "@/modules/treasury/cash-record";
import { CorrectionDialog } from "./correction-dialog";
import { instantLabel, montantLabel } from "./format";
import type { MovementLine } from "./types";

export type LigneCorrigible = MovementLine & {
  transfertLie: boolean;
};

const COLONNES = [
  "Date",
  "Compte",
  "Catégorie",
  "Montant",
  "Description",
  "Par",
] as const;

export function MovementTable({
  lignes,
  peutCorriger = false,
  messageVide = "Aucun mouvement pour le moment. Le premier enregistrement apparaîtra ici.",
}: {
  lignes: MovementLine[];
  peutCorriger?: boolean;
  messageVide?: string;
}) {
  if (lignes.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        {messageVide}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
        <caption className="sr-only">Mouvements de trésorerie</caption>
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            {COLONNES.map((colonne) => (
              <th key={colonne} scope="col" className="px-3 py-2.5 font-medium">
                {colonne}
              </th>
            ))}
            {peutCorriger ? (
              <th scope="col" className="px-3 py-2.5">
                <span className="sr-only">Correction</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y">
          {lignes.map((ligne) => {
            const entree = ligne.direction === "IN";
            const corrigee = ligne.correctedOf !== null;
            return (
              <tr key={ligne.id} className="transition-colors hover:bg-muted/30">
                <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground tabular-nums">
                  {instantLabel(ligne.occurredAt)}
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium">{ligne.compteLabel}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {ligne.currency}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[ligne.category as CashCategory] ?? ligne.category}
                    </Badge>
                    {ligne.kind === "CORRECTION" ? (
                      <Badge
                        variant="outline"
                        className="border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      >
                        Correction
                      </Badge>
                    ) : ligne.sourceKind === "AUTOMATIC" ? (
                      <Badge variant="outline">Automatique</Badge>
                    ) : null}
                    {ligne.transferId ? (
                      <Badge variant="outline" className="gap-1">
                        <RepeatIcon className="size-3" aria-hidden />
                        Transfert
                      </Badge>
                    ) : null}
                    {corrigee ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        Annulée par correction
                      </Badge>
                    ) : null}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span className="flex items-center gap-1.5">
                    {entree ? (
                      <ArrowDownLeftIcon
                        aria-hidden
                        className="size-3.5 text-emerald-600 dark:text-emerald-400"
                      />
                    ) : (
                      <ArrowUpRightIcon
                        aria-hidden
                        className="size-3.5 text-rose-600 dark:text-rose-400"
                      />
                    )}
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        entree
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400",
                      )}
                    >
                      {entree ? "+" : "−"}
                      {montantLabel(ligne.amount, ligne.currency)}
                    </span>
                    <span className="sr-only">
                      {DIRECTION_LABELS[ligne.direction as MovementDirection] ?? ligne.direction}
                    </span>
                  </span>
                </td>
                <td className="max-w-60 px-3 py-2.5 text-muted-foreground">
                  <span className="line-clamp-2">{ligne.description ?? "—"}</span>
                </td>
                <td className="max-w-32 truncate px-3 py-2.5 text-muted-foreground">
                  {ligne.auteur ?? "—"}
                </td>
                {peutCorriger ? (
                  <td className="px-3 py-2.5 text-right">
                    {ligne.kind === "OPERATION" && !corrigee ? (
                      <CorrectionDialog ligne={{ ...ligne, transfertLie: ligne.transferId !== null }} />
                    ) : null}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
