"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { lireTotauxAction } from "./cash-actions";
import { montantLabel } from "./format";
import { CATEGORY_LABELS, type CashCategory } from "@/modules/treasury/cash-record";
import type { TotauxPeriode } from "./types";

const AUJOURDHUI = new Date();
const JOUR_DEFAUT = `${AUJOURDHUI.getFullYear()}-${String(AUJOURDHUI.getMonth() + 1).padStart(2, "0")}-${String(AUJOURDHUI.getDate()).padStart(2, "0")}`;

export function PeriodTotals({ totauxInitiaux }: { totauxInitiaux: TotauxPeriode }) {
  const [totaux, setTotaux] = React.useState(totauxInitiaux);
  const [du, setDu] = React.useState(JOUR_DEFAUT);
  const [au, setAu] = React.useState(JOUR_DEFAUT);
  const [enCours, debuter] = useTransition();

  function recalculer(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    debuter(async () => {
      const issue = await lireTotauxAction(du, au);
      if (issue.ok) {
        setTotaux(issue.totaux);
      } else {
        toast.add({ type: "error", title: "Totaux indisponibles", description: issue.erreur });
      }
    });
  }

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold">Totaux de flux</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Les transferts ne figurent pas ici : un transfert n&apos;est ni une
          recette ni une dépense.
        </p>
      </div>

      <form onSubmit={recalculer} className="flex items-end gap-3 border-b bg-muted/30 p-4">
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="totals-from" className="text-[11px]">
            Du
          </FieldLabel>
          <Input
            id="totals-from"
            type="date"
            value={du}
            onChange={(evenement) => setDu(evenement.target.value)}
            required
          />
        </Field>
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="totals-to" className="text-[11px]">
            Au
          </FieldLabel>
          <Input
            id="totals-to"
            type="date"
            value={au}
            onChange={(evenement) => setAu(evenement.target.value)}
            required
          />
        </Field>
        <Button type="submit" variant="outline" size="sm" disabled={enCours}>
          {enCours ? "Calcul…" : "Recalculer"}
        </Button>
      </form>

      {totaux.parDevise.length === 0 ? (
        <p className="p-4 text-xs text-muted-foreground">
          Aucun flux sur cette période, hors transferts.
        </p>
      ) : (
        <div className="divide-y">
          {totaux.parDevise.map((panier) => {
            const net = panier.entrees - panier.sorties;
            return (
              <div key={panier.devise} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">{panier.devise}</h3>
                  <p
                    className={
                      net >= 0
                        ? "text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400"
                        : "text-sm font-semibold tabular-nums text-rose-700 dark:text-rose-400"
                    }
                  >
                    {net >= 0 ? "+" : "−"}
                    {montantLabel(Math.abs(net), panier.devise)}
                  </p>
                </div>
                <dl className="mt-2 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Entrées</dt>
                    <dd className="tabular-nums">{montantLabel(panier.entrees, panier.devise)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Sorties</dt>
                    <dd className="tabular-nums">{montantLabel(panier.sorties, panier.devise)}</dd>
                  </div>
                </dl>
                {panier.categories.length > 0 ? (
                  <dl className="mt-3 flex flex-col gap-1 border-t pt-3 text-xs">
                    {panier.categories.map((ligne) => (
                      <div
                        key={`${panier.devise}:${ligne.categorie}`}
                        className="flex justify-between gap-3"
                      >
                        <dt className="text-muted-foreground">
                          {CATEGORY_LABELS[ligne.categorie as CashCategory] ?? ligne.categorie}
                        </dt>
                        <dd className="tabular-nums">
                          {montantLabel(ligne.entrees + ligne.sorties, panier.devise)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
