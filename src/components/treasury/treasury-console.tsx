"use client";

import * as React from "react";
import { BanknoteIcon, SmartphoneIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ACCOUNT_TYPE_LABELS,
  estTypeCompte,
  reseauLabel,
} from "@/modules/treasury/cash-record";
import { AccountForm } from "./account-form";
import { MovementForm } from "./movement-form";
import { MovementTable } from "./movement-table";
import { PeriodTotals } from "./period-totals";
import { TransferForm } from "./transfer-form";
import { soldeLabel } from "./format";
import type { CompteAffiche, MovementLine, TotauxPeriode } from "./types";

const TITRES_SECTION = {
  mouvements: "Mouvements récents",
} as const;

function CompteCard({ compte }: { compte: CompteAffiche }) {
  const electronique = compte.type === "ELECTRONIC_MONEY";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              electronique
                ? "bg-primary/10 text-primary"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            )}
          >
            {electronique ? (
              <SmartphoneIcon className="size-4" />
            ) : (
              <BanknoteIcon className="size-4" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {compte.label}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {estTypeCompte(compte.type) ? ACCOUNT_TYPE_LABELS[compte.type] : compte.type}
              {electronique && compte.network !== "" ? ` · ${reseauLabel(compte.network)}` : ""}
            </span>
          </span>
        </span>
        <Badge variant="outline" className="tabular-nums">
          {compte.currency}
        </Badge>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
        {soldeLabel(compte.solde, compte.currency)}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Calculé depuis l&apos;ouverture et les mouvements.
      </p>
    </div>
  );
}

export function TreasuryConsole({
  comptes,
  mouvements,
  totaux,
  peutCorriger = false,
}: {
  comptes: CompteAffiche[];
  mouvements: MovementLine[];
  totaux: TotauxPeriode;
  peutCorriger?: boolean;
}) {
  const vide = comptes.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="treasury-accounts" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="treasury-accounts" className="text-sm font-medium">
            Comptes
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <AccountForm comptes={comptes} />
            {!vide ? (
              <>
                <MovementForm comptes={comptes} />
                <TransferForm comptes={comptes} />
              </>
            ) : null}
          </div>
        </div>
        {vide ? (
          <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
            Aucun compte de trésorerie. Ouvrez d&apos;abord la caisse ou un
            compte de monnaie électronique.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {comptes.map((compte) => (
              <CompteCard key={compte.id} compte={compte} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="treasury-movements" className="flex flex-col gap-3">
          <h2 id="treasury-movements" className="text-sm font-medium">
            {TITRES_SECTION.mouvements}
          </h2>
          <MovementTable lignes={mouvements} peutCorriger={peutCorriger} />
        </section>
        <PeriodTotals totauxInitiaux={totaux} />
      </div>
    </div>
  );
}
