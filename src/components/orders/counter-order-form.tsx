"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCounterOrderAction } from "@/modules/orders/actions";
import {
  billedAmount,
  unitsForBilledAmount,
} from "@/modules/orders/order-record";

export type CounterPrice = {
  network: string;
  label: string;
  amount: number;
  currency: string;
};

export type ClientTicket = {
  nom: string;
  detail: string;
};

function LigneTicket({
  libelle,
  children,
}: {
  libelle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{libelle}</span>
      <span className="tabular-nums">{children}</span>
    </div>
  );
}

export function CounterOrderForm({
  client,
  clientDetail,
  changerHref,
  profileId,
  prices,
  retour,
}: {
  client: string;
  clientDetail: string;
  changerHref: string;
  profileId: string;
  prices: CounterPrice[];
  retour: string;
}) {
  const [network, setNetwork] = useState(prices[0]?.network ?? "ORANGE");
  const [type, setType] = useState("PREPAID");
  const [mode, setMode] = useState<"UNITS" | "AMOUNT">("UNITS");
  const [valeur, setValeur] = useState("");

  const price = prices.find((ligne) => ligne.network === network) ?? null;
  const nombre = Number(valeur.replace(",", ".").replace(/\s/g, ""));
  const valide = Number.isFinite(nombre) && nombre > 0;
  const units =
    price && valide
      ? mode === "UNITS"
        ? Math.trunc(nombre)
        : unitsForBilledAmount(price.amount, nombre)
      : 0;
  const montant = price && units > 0 ? billedAmount(price.amount, units) : 0;
  const reste =
    mode === "AMOUNT" && valide && montant > 0 ? Math.trunc(nombre) - montant : 0;
  const pret = price !== null && units > 0;

  return (
    <form action={createCounterOrderAction} className="max-w-2xl">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="retour" value={retour} />

      <Card size="sm" className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-dashed px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Client
            </p>
            <p className="mt-0.5 text-sm font-semibold">{client}</p>
            <p className="text-sm text-muted-foreground">{clientDetail}</p>
          </div>
          <Link
            href={changerHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Changer de client
          </Link>
        </div>

        <div className="flex flex-col gap-5 px-4 py-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Réseau</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {prices.map((ligne) => (
                <label
                  key={ligne.network}
                  className={`flex cursor-pointer flex-col rounded-lg border px-3 py-2 text-sm transition-colors ${
                    network === ligne.network
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  } ${ligne.amount > 0 ? "" : "cursor-not-allowed opacity-60"}`}
                >
                  <input
                    type="radio"
                    name="network"
                    value={ligne.network}
                    checked={network === ligne.network}
                    onChange={() => setNetwork(ligne.network)}
                    className="sr-only"
                    disabled={ligne.amount <= 0}
                  />
                  <span className="font-medium">{ligne.label}</span>
                  <span className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                    {ligne.amount > 0
                      ? `${ligne.amount.toLocaleString("fr-FR")} ${ligne.currency} / 100 unités`
                      : "Aucun prix"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Paiement</legend>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "PREPAID", label: "Prépayé" },
                { value: "CREDIT", label: "À crédit" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
                    type === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={type === option.value}
                    onChange={() => setType(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Saisie</span>
              <div className="flex rounded-lg border p-0.5">
                {[
                  { value: "UNITS" as const, label: "Unités" },
                  { value: "AMOUNT" as const, label: "Montant" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setMode(option.value);
                      setValeur("");
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      mode === option.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <Label htmlFor="quantite">
              {mode === "UNITS"
                ? "Nombre d'unités"
                : `Montant demandé${price ? ` (${price.currency})` : ""}`}
            </Label>
            <Input
              id="quantite"
              name={mode === "UNITS" ? "units" : "amount"}
              inputMode="numeric"
              autoComplete="off"
              value={valeur}
              onChange={(event) => setValeur(event.target.value)}
              placeholder={mode === "UNITS" ? "1000" : "23500"}
              className="max-w-xs tabular-nums"
            />
          </div>
        </div>

        <div className="border-t border-dashed px-4 py-3">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Total
          </p>
          {price === null ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Ce réseau n&apos;a pas de prix : la commande ne peut pas être
              chiffrée.
            </p>
          ) : pret ? (
            <>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {montant.toLocaleString("fr-FR")} {price.currency}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  à payer
                </span>
              </p>
              <div className="mt-1.5 flex flex-col gap-0.5">
                <LigneTicket libelle="Unités">
                  {units.toLocaleString("fr-FR")}
                </LigneTicket>
                {reste > 0 ? (
                  <LigneTicket libelle="Non facturé">
                    {reste.toLocaleString("fr-FR")} {price.currency}
                  </LigneTicket>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Saisissez une quantité pour voir le montant.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3">
          <Button type="submit" disabled={!pret}>
            Créer la commande
          </Button>
          <p className="text-xs text-muted-foreground">
            Le prix est figé au moment de la création.
          </p>
        </div>
      </Card>
    </form>
  );
}
