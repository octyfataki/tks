"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  CircleAlertIcon,
  PencilIcon,
  ScrollTextIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  isBelowOfficialRate,
  isValidAmount,
  readAmount,
} from "@/modules/pricing/price-record";
import { publierPrixAction, type ResultatPrix } from "./actions";

export type BoardEntry = {
  amount: number;
  currency: string;
  amountLabel: string;
  equivalentLabel: string | null;
  sampleLabel: string;
  effectiveAtLabel: string;
  authorLabel: string;
};

export type BoardRow = {
  network: string;
  label: string;
  current: BoardEntry | null;
  history: BoardEntry[];
};

export type OfficialRate = {
  value: number;
  label: string;
};

const NOMBRE = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

function PriceRow({
  row,
  currencies,
  unitsPerDollar,
  sampleUnits,
  officialRate,
}: {
  row: BoardRow;
  currencies: readonly string[];
  unitsPerDollar: number;
  sampleUnits: number;
  officialRate: OfficialRate | null;
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const [montant, setMontant] = React.useState("");
  const [devise, setDevise] = React.useState(row.current?.currency ?? "CDF");
  const [resultat, action, enCours] = useActionState(publierPrixAction, null);
  const dernierResultat = React.useRef<ResultatPrix | null>(null);

  React.useEffect(() => {
    if (!resultat || dernierResultat.current === resultat) return;
    dernierResultat.current = resultat;
    if (resultat.ok) {
      toast.add({
        type: "success",
        title: "Prix publié",
        description: `${row.label} : ${NOMBRE.format(resultat.amount)} ${resultat.currency} les ${unitsPerDollar} unités.`,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- referme la saisie après publication, une fois par résultat
      setMontant("");
      setOuvert(false);
    } else {
      toast.add({
        type: "error",
        title: "Publication impossible",
        description: resultat.erreur,
      });
    }
  }, [resultat, row.label, unitsPerDollar]);

  const saisi = readAmount(montant);
  const apercuValide = isValidAmount(saisi);
  const apercuLabel = apercuValide ? `${NOMBRE.format(saisi)} ${devise}` : null;
  const avertissement =
    apercuValide &&
    isBelowOfficialRate({ amount: saisi, currency: devise }, officialRate?.value ?? null);

  return (
    <div className="flex flex-col gap-3 p-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{row.label}</p>
          {row.current ? (
            <>
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-xl font-semibold tracking-tight tabular-nums">
                  {row.current.amountLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  les {unitsPerDollar} unités
                </span>
                {row.current.equivalentLabel ? (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {row.current.equivalentLabel}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pour {NOMBRE.format(sampleUnits)} unités :{" "}
                <span className="tabular-nums">{row.current.sampleLabel}</span> ·
                posé le {row.current.effectiveAtLabel} par {row.current.authorLabel}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              non défini — aucune commande ne peut citer ce réseau
            </p>
          )}
          {row.network === "OTHER" && row.current === null ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Un opérateur nouveau se façonne ici, à défaut d&apos;une ligne à
              son nom.
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant={ouvert ? "ghost" : "outline"}
          onClick={() => setOuvert((etat) => !etat)}
        >
          <PencilIcon />
          {ouvert ? "Fermer" : row.current ? "Changer le prix" : "Définir le prix"}
        </Button>
      </div>

      {ouvert ? (
        <form
          action={action}
          className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3"
        >
          <input type="hidden" name="network" value={row.network} />
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`amount-${row.network}`}
                className="mb-1.5 block text-xs font-medium"
              >
                Prix de {unitsPerDollar} unités — un dollar d&apos;airtime
              </label>
              <Input
                id={`amount-${row.network}`}
                name="amount"
                value={montant}
                onChange={(evenement) => setMontant(evenement.target.value)}
                inputMode="numeric"
                autoComplete="off"
                required
                placeholder={row.current ? String(row.current.amount) : "2500"}
              />
            </div>
            <div>
              <label
                htmlFor={`currency-${row.network}`}
                className="mb-1.5 block text-xs font-medium"
              >
                Devise
              </label>
              <select
                id={`currency-${row.network}`}
                name="currency"
                value={devise}
                onChange={(evenement) => setDevise(evenement.target.value)}
                className="h-9 rounded-md border bg-transparent px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {currencies.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={enCours || !apercuValide}>
              {enCours ? "Publication…" : "Publier"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMontant("");
                setOuvert(false);
              }}
            >
              Annuler
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {row.current ? (
              <>
                Avant :{" "}
                <span className="tabular-nums">{row.current.amountLabel}</span>{" "}
                ·{" "}
              </>
            ) : null}
            Après :{" "}
            <span className="font-medium text-foreground tabular-nums">
              {apercuLabel ?? "à saisir"}
            </span>{" "}
            les {unitsPerDollar} unités · effet immédiat
          </p>

          {avertissement && officialRate ? (
            <p className="flex gap-2 rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Ce prix passe sous le taux du jour ({officialRate.label} :{" "}
                {NOMBRE.format(officialRate.value)} CDF pour 1 USD). Le dollar
                d&apos;airtime se vendrait à perte. La publication reste
                possible.
              </span>
            </p>
          ) : null}
        </form>
      ) : null}

      {row.history.length > 0 ? (
        <details className="group">
          <summary className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-muted-foreground select-none hover:text-foreground">
            <ScrollTextIcon className="size-3.5" />
            Historique ({row.history.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {row.history.map((entree, index) => (
              <li
                key={`${row.network}-${entree.effectiveAtLabel}-${index}`}
                className="flex flex-wrap items-baseline gap-x-2 rounded-lg border bg-card px-2.5 py-1.5 text-xs"
              >
                <span className="tabular-nums font-medium">{entree.amountLabel}</span>
                {entree.equivalentLabel ? (
                  <span className="tabular-nums text-muted-foreground">
                    {entree.equivalentLabel}
                  </span>
                ) : null}
                <span className="text-muted-foreground">
                  {entree.effectiveAtLabel} · {entree.authorLabel}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function PriceGridBoard({
  rows,
  currencies,
  unitsPerDollar,
  sampleUnits,
  officialRate,
}: {
  rows: BoardRow[];
  currencies: readonly string[];
  unitsPerDollar: number;
  sampleUnits: number;
  officialRate: OfficialRate | null;
}) {
  const sansPrix = rows.filter((row) => row.current === null).length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">Grille tarifaire</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Le prix d&apos;un dollar d&apos;airtime — {unitsPerDollar} unités — par
          réseau. Une saisie prend effet immédiatement et n&apos;écrase jamais
          rien : chaque changement s&apos;ajoute comme une ligne datée, au
          journal comme ici.
        </p>
      </header>

      {sansPrix > 0 ? (
        <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          {sansPrix === 1
            ? "Un réseau n'a aucun prix : aucune commande ne peut le citer."
            : `${sansPrix} réseaux n'ont aucun prix : aucune commande ne peut les citer.`}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-xl border bg-card">
        {rows.map((row, index) => (
          <div key={row.network} className={index === 0 ? undefined : "border-t"}>
            <PriceRow
              row={row}
              currencies={currencies}
              unitsPerDollar={unitsPerDollar}
              sampleUnits={sampleUnits}
              officialRate={officialRate}
            />
          </div>
        ))}
      </section>

      <p className="text-xs text-muted-foreground">
        {officialRate
          ? `Taux du ${officialRate.label} : ${NOMBRE.format(officialRate.value)} CDF pour 1 USD. Le chiffre qui engage est celui de la devise du prix ; l'équivalent n'est qu'un repère.`
          : "Aucun taux n'est saisi pour aujourd'hui : les équivalents ne s'affichent pas. Ils reviendront avec le taux."}
      </p>
    </div>
  );
}
