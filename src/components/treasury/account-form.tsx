"use client";

import * as React from "react";
import { useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { readAmount, CLOSED_NETWORKS, CURRENCIES, NETWORK_LABELS } from "@/modules/pricing/price-record";
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  estDevise,
  reseauLabel,
} from "@/modules/treasury/cash-record";
import { ouvrirCompteAction, type ResultatOuvertureCompte } from "./cash-actions";
import { montantLabel } from "./format";
import type { CompteAffiche } from "./types";

export function AccountForm({
  comptes,
  triggerVariant = "default",
}: {
  comptes: CompteAffiche[];
  triggerVariant?: "default" | "secondary" | "outline";
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const isMobile = useIsMobile();
  const [type, setType] = React.useState<string>("CASH");
  const [reseau, setReseau] = React.useState<string>("ORANGE");
  const [devise, setDevise] = React.useState<string>("USD");
  const [ouverture, setOuverture] = React.useState("");
  const [enCours, debuter] = useTransition();

  const typeChoisi = type === "ELECTRONIC_MONEY" ? "ELECTRONIC_MONEY" : "CASH";
  const deviseChoisie = estDevise(devise) ? devise : "USD";
  const montantsPris = new Set(comptes.map((c) => `${c.type}:${c.network}:${c.currency}`));
  const caisseExiste = comptes.some((c) => c.type === "CASH");
  const electroniquePris = montantsPris.has(
    `ELECTRONIC_MONEY:${reseau}:${deviseChoisie}`,
  );
  const ouvertureLue = readAmount(ouverture);
  const ouvertureValide =
    Number.isInteger(ouvertureLue) && ouvertureLue >= 0 && ouverture !== "";
  const bloquant = typeChoisi === "CASH" ? caisseExiste : electroniquePris;

  function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!ouvertureValide || bloquant) return;
    debuter(async () => {
      let issue: ResultatOuvertureCompte = {
        ok: false,
        erreur: "Ouverture impossible.",
      };
      try {
        issue = await ouvrirCompteAction({
          type: typeChoisi,
          network: typeChoisi === "ELECTRONIC_MONEY" ? reseau : "",
          currency: deviseChoisie,
          openingAmount: ouvertureLue,
          openedAt: new Date(),
          deviceId: null,
        });
      } finally {
        if (issue.ok) {
          toast.add({
            type: "success",
            title: "Compte ouvert",
            description: `${issue.compte.label} — solde d'ouverture ${montantLabel(issue.compte.openingAmount, issue.compte.currency)}.`,
          });
          setOuverture("");
          setOuvert(false);
        } else {
          toast.add({ type: "error", title: "Ouverture impossible", description: issue.erreur });
        }
      }
    });
  }

  return (
    <Drawer
      open={ouvert}
      onOpenChange={setOuvert}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerTrigger render={<Button variant={triggerVariant} />}>
        Ouvrir un compte
      </DrawerTrigger>
      <DrawerContent showCloseButton={false}>
        <form onSubmit={soumettre} className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="border-b p-4">
            <DrawerTitle>Ouvrir un compte</DrawerTitle>
            <DrawerDescription>
              Un compte est tenu dans une seule devise, fixée à l&apos;ouverture.
              Le solde part du montant d&apos;ouverture et se calcule ensuite à
              partir des mouvements.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="account-type">Type de compte</FieldLabel>
                <Select value={type} onValueChange={(valeur) => setType(String(valeur))}>
                  <SelectTrigger id="account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((candidat) => (
                      <SelectItem key={candidat} value={candidat}>
                        {ACCOUNT_TYPE_LABELS[candidat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {typeChoisi === "CASH" ? (
                  <FieldDescription>
                    La caisse physique est unique par devise.
                  </FieldDescription>
                ) : (
                  <FieldDescription>
                    Un compte par réseau de monnaie électronique.
                  </FieldDescription>
                )}
              </Field>

              {typeChoisi === "ELECTRONIC_MONEY" ? (
                <Field>
                  <FieldLabel htmlFor="account-network">Réseau</FieldLabel>
                  <Select value={reseau} onValueChange={(valeur) => setReseau(String(valeur))}>
                    <SelectTrigger id="account-network">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLOSED_NETWORKS.map((candidat) => (
                        <SelectItem key={candidat} value={candidat}>
                          {NETWORK_LABELS[candidat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="account-currency">Devise</FieldLabel>
                </div>
                <Select value={devise} onValueChange={(valeur) => setDevise(String(valeur))}>
                  <SelectTrigger id="account-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((candidat) => (
                      <SelectItem key={candidat} value={candidat}>
                        {candidat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Fixée à l&apos;ouverture : un mouvement dans une autre devise
                  sera refusé sur ce compte.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="account-opening">
                  Solde d&apos;ouverture
                </FieldLabel>
                <Input
                  id="account-opening"
                  value={ouverture}
                  onChange={(evenement) => setOuverture(evenement.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  placeholder="0"
                  aria-describedby="account-opening-hint"
                  className="h-14 px-3 text-3xl font-semibold tracking-tight tabular-nums"
                />
                <FieldDescription id="account-opening-hint">
                  Ce qu&apos;il y a réellement sur le compte au moment de
                  l&apos;ouverture, en {deviseChoisie}. Zéro admis.
                </FieldDescription>
              </Field>

              {bloquant ? (
                <p className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  {typeChoisi === "CASH"
                    ? "La caisse existe déjà : une seule caisse physique."
                    : `Un compte ${reseauLabel(reseau)} en ${deviseChoisie} existe déjà.`}
                </p>
              ) : null}
            </FieldGroup>
          </div>

          <DrawerFooter className="border-t">
            <Button
              type="submit"
              className="h-[34px]"
              disabled={enCours || !ouvertureValide || bloquant}
            >
              {enCours ? "Ouverture…" : "Ouvrir le compte"}
            </Button>
            <DrawerClose render={<Button variant="outline" className="h-[34px]" />}>
              Annuler
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
