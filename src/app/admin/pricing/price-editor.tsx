"use client";

import * as React from "react";
import { useActionState } from "react";
import Image from "next/image";
import { CircleAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  amountForUnits,
  isBelowOfficialRate,
  isValidAmount,
  networkLabel,
  readAmount,
  type Network,
} from "@/modules/pricing/price-record";
import { publierPrixAction, type ResultatPrix } from "./actions";
import { NETWORK_LOGOS } from "./network-logo";
import {
  NOMBRE,
  SAMPLE_UNITS,
  equivalentLabel,
  type OfficialRate,
  type PriceEntry,
} from "./pricing-display";

export function PriceEditor({
  network,
  current,
  currencies,
  unitsPerDollar,
  officialRate,
  triggerVariant = "default",
  triggerClassName,
}: {
  network: Network;
  current: PriceEntry | null;
  currencies: readonly string[];
  unitsPerDollar: number;
  officialRate: OfficialRate | null;
  triggerVariant?: "default" | "secondary";
  triggerClassName?: string;
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const isMobile = useIsMobile();
  const [montant, setMontant] = React.useState("");
  const [devise, setDevise] = React.useState(current?.currency ?? "CDF");
  const [resultat, action, enCours] = useActionState(publierPrixAction, null);
  const dernierResultat = React.useRef<ResultatPrix | null>(null);

  React.useEffect(() => {
    if (!resultat || dernierResultat.current === resultat) return;
    dernierResultat.current = resultat;
    if (resultat.ok) {
      toast.add({
        type: "success",
        title: "Prix publié",
        description: `${NOMBRE.format(resultat.amount)} ${resultat.currency} les ${unitsPerDollar} unités.`,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- remet la saisie à zéro, une fois par publication
      setMontant("");
      setOuvert(false);
    } else {
      toast.add({
        type: "error",
        title: "Publication impossible",
        description: resultat.erreur,
      });
    }
  }, [resultat, unitsPerDollar]);

  const saisi = readAmount(montant);
  const apercuValide = isValidAmount(saisi);
  const apercuLabel = apercuValide ? `${NOMBRE.format(saisi)} ${devise}` : null;
  const equivalentSaisi = apercuValide
    ? equivalentLabel(saisi, devise, officialRate?.value ?? null)
    : null;
  const echantillon = apercuValide
    ? amountForUnits(saisi, SAMPLE_UNITS)
    : null;
  const avertissement =
    apercuValide &&
    isBelowOfficialRate(
      { amount: saisi, currency: devise },
      officialRate?.value ?? null,
    );
  const titre = current ? "Modifier le prix" : "Publier un prix";

  return (
    <Drawer
      open={ouvert}
      onOpenChange={setOuvert}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerTrigger
        render={
          <Button variant={triggerVariant} className={triggerClassName} />
        }
      >
        {titre}
      </DrawerTrigger>
      <DrawerContent showCloseButton={false}>
        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="network" value={network} />
          <input type="hidden" name="currency" value={devise} />

          <DrawerHeader className="border-b p-4">
            <DrawerTitle>{titre}</DrawerTitle>
            <DrawerDescription>
              Le prix s&apos;applique aux nouvelles commandes ; les commandes
              passées gardent le leur.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              <section className="flex items-start gap-3 rounded-xl border bg-card p-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/10">
                  <Image
                    src={NETWORK_LOGOS[network]}
                    alt=""
                    width={128}
                    height={128}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">
                      {networkLabel(network)}
                    </h2>
                    {current ? (
                      <Badge variant="secondary">En vigueur</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      >
                        Sans prix
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Référentiel : {NOMBRE.format(unitsPerDollar)} unités
                    d&apos;airtime = 1 USD.
                  </p>
                  {officialRate ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Taux du {officialRate.label} :{" "}
                      <span className="tabular-nums">
                        {NOMBRE.format(officialRate.value)} CDF
                      </span>{" "}
                      pour 1 USD.
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Aucun taux du jour : les équivalents sont masqués.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-xl border bg-card p-3">
                <h2 className="text-[11px] font-medium text-muted-foreground">
                  Prix en vigueur
                </h2>
                {current ? (
                  <>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                      <span className="text-xl font-semibold tracking-tight tabular-nums">
                        {current.amountLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        les {NOMBRE.format(unitsPerDollar)} unités
                      </span>
                    </p>
                    {current.equivalentLabel ? (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {current.equivalentLabel}
                      </p>
                    ) : null}
                    <dl className="mt-2 flex flex-col gap-0.5 text-[11px] text-muted-foreground">
                      <div className="flex flex-wrap justify-between gap-x-3">
                        <dt>En vigueur depuis le</dt>
                        <dd className="tabular-nums">
                          {current.effectiveAtLabel}
                        </dd>
                      </div>
                      <div className="flex flex-wrap justify-between gap-x-3">
                        <dt>Publié par</dt>
                        <dd className="truncate">{current.authorLabel}</dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Aucun prix publié pour ce réseau. Tant qu&apos;il n&apos;en
                    a pas, aucune commande ne peut le citer.
                  </p>
                )}
              </section>

              <FieldGroup>
                <Field>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor="price-amount">Nouveau prix</FieldLabel>
                    <div
                      role="group"
                      aria-label="Devise du prix"
                      className="flex items-center gap-0.5 rounded-md border bg-input/20 p-0.5 dark:bg-input/30"
                    >
                      {currencies.map((code) => (
                        <Button
                          key={code}
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-pressed={code === devise}
                          className="h-6 min-w-12 rounded-sm px-2 text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:ring-1 aria-pressed:ring-foreground/10"
                          onClick={() => setDevise(code)}
                        >
                          {code}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Input
                    id="price-amount"
                    name="amount"
                    value={montant}
                    onChange={(evenement) => setMontant(evenement.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    placeholder={current ? String(current.amount) : "2500"}
                    aria-describedby="price-amount-hint"
                    className="h-14 px-3 text-3xl font-semibold tracking-tight tabular-nums"
                  />
                  <FieldDescription id="price-amount-hint">
                    Montant entier, en {devise}, pour{" "}
                    {NOMBRE.format(unitsPerDollar)} unités d&apos;airtime.
                  </FieldDescription>
                </Field>
              </FieldGroup>

              <section className="overflow-hidden rounded-xl border bg-card">
                <div className="grid grid-cols-2 divide-x">
                  <div className="min-w-0 p-3">
                    <p className="text-[11px] text-muted-foreground">Avant</p>
                    <p className="mt-0.5 text-sm font-medium tabular-nums">
                      {current ? (
                        current.amountLabel
                      ) : (
                        <span className="font-normal text-muted-foreground">
                          Aucun prix
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">
                      {current?.equivalentLabel ?? "\u00a0"}
                    </p>
                  </div>
                  <div className="min-w-0 p-3">
                    <p className="text-[11px] text-muted-foreground">Après</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">
                      {apercuLabel ?? (
                        <span className="font-normal text-muted-foreground">
                          À saisir
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">
                      {equivalentSaisi ?? "Effet immédiat"}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t bg-muted/40 px-3 py-2">
                  <span className="text-[11px] text-muted-foreground">
                    {NOMBRE.format(SAMPLE_UNITS)} unités
                  </span>
                  <span className="text-xs font-medium tabular-nums">
                    {echantillon === null
                      ? "—"
                      : `${NOMBRE.format(echantillon)} ${devise}`}
                  </span>
                </div>
              </section>

              {avertissement && officialRate ? (
                <p className="flex gap-2 rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Ce prix passe sous le taux du jour ({officialRate.label} :{" "}
                    {NOMBRE.format(officialRate.value)} CDF pour 1 USD). Le
                    dollar d&apos;airtime se vendrait à perte. La publication
                    reste possible.
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <DrawerFooter className="border-t">
            <Button
              type="submit"
              className="h-[34px]"
              disabled={enCours || !apercuValide}
            >
              {enCours ? "Publication…" : "Publier"}
            </Button>
            <DrawerClose
              render={<Button variant="outline" className="h-[34px]" />}
            >
              Annuler
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
