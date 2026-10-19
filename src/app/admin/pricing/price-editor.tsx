"use client";

import * as React from "react";
import { useActionState } from "react";
import { CircleAlertIcon } from "lucide-react";
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
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  isBelowOfficialRate,
  isValidAmount,
  readAmount,
  type Network,
} from "@/modules/pricing/price-record";
import { publierPrixAction, type ResultatPrix } from "./actions";
import { NOMBRE, type OfficialRate, type PriceEntry } from "./pricing-display";

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
  const avertissement =
    apercuValide &&
    isBelowOfficialRate(
      { amount: saisi, currency: devise },
      officialRate?.value ?? null,
    );

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
        {current ? "Modifier le prix" : "Publier un prix"}
      </DrawerTrigger>
      <DrawerContent showCloseButton={false}>
        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="network" value={network} />
          <input type="hidden" name="currency" value={devise} />

          <DrawerHeader>
            <DrawerTitle>
              {current ? "Modifier le prix" : "Publier un prix"}
            </DrawerTitle>
            <DrawerDescription>
              {unitsPerDollar} unités d&apos;airtime, soit un dollar.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="price-amount">
                  Montant en {devise}
                </FieldLabel>
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
                  className="h-12 text-2xl font-semibold tabular-nums"
                />
                <FieldDescription id="price-amount-hint">
                  Prix de {unitsPerDollar} unités d&apos;airtime.
                </FieldDescription>
              </Field>

              <Field>
                <FieldTitle>Devise</FieldTitle>
                <div className="flex gap-1.5">
                  {currencies.map((code) => (
                    <Button
                      key={code}
                      type="button"
                      variant={code === devise ? "default" : "outline"}
                      aria-pressed={code === devise}
                      className="h-8 min-w-16"
                      onClick={() => setDevise(code)}
                    >
                      {code}
                    </Button>
                  ))}
                </div>
              </Field>

              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                {current ? (
                  <>
                    Avant :{" "}
                    <span className="tabular-nums">{current.amountLabel}</span>
                    <br />
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
                    {NOMBRE.format(officialRate.value)} CDF pour 1 USD). Le
                    dollar d&apos;airtime se vendrait à perte. La publication
                    reste possible.
                  </span>
                </p>
              ) : null}
            </FieldGroup>
          </div>

          <DrawerFooter>
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
